import { createClient, type Session } from "@supabase/supabase-js";
import { cacheGet, cacheSet } from "./offline-cache";
import { drain, enqueue, type QueueEntry } from "./offline-queue";

// Supabase public credentials.
//
// Historically these came from `utils/supabase/info.tsx`, a platform-managed
// file that is regenerated when you connect Supabase from Figma Make. That
// file is not always present (fresh checkout, CI clone), and a hard static
// import of a missing module breaks the whole build/dev server. To stay
// resilient we resolve from Vite env vars first and fall back to the optional
// info module only when it exists.
//
// Both values are PUBLIC-safe: `projectId` is just the project subdomain and
// `publicAnonKey` is the publishable anon key (data is protected by RLS). The
// secret `service_role` key must NEVER appear here — it lives only in
// `supabase secrets` on the Edge Function.
const env = (import.meta as any).env ?? {};
const infoModules = import.meta.glob("../../../utils/supabase/info.tsx", { eager: true }) as Record<
  string,
  { projectId?: string; publicAnonKey?: string; supabaseUrl?: string }
>;
const info = Object.values(infoModules)[0] ?? {};

// IPPOO Social-Fact runs on a SELF-HOSTED Supabase (Kong gateway), not a hosted
// *.supabase.co project. So we resolve a full base URL rather than a projectId.
// Order of precedence: Vite env var → info.tsx (if connected via Figma) →
// the known public production URL. All three values below are PUBLIC-safe.
const DEFAULT_SUPABASE_URL = "https://socialfaktdatabase.ippoo-aptdc.com";
const DEFAULT_ANON_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MjM5MDYwMCwiZXhwIjo0OTM4MDY0MjAwLCJyb2xlIjoiYW5vbiJ9.xV8OO9ZdxUauWS8l_s8aVSToCEs1htYapmQCVS7P7Qo";

export const SUPABASE_URL: string =
  env.VITE_SUPABASE_URL ||
  info.supabaseUrl ||
  (env.VITE_SUPABASE_PROJECT_ID ? `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : "") ||
  (info.projectId ? `https://${info.projectId}.supabase.co` : "") ||
  DEFAULT_SUPABASE_URL;

// Kept exported for backwards-compat (some callers reference projectId); derive
// it from the URL host when possible, else empty.
export const projectId: string =
  env.VITE_SUPABASE_PROJECT_ID || info.projectId || "";

export const publicAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY || info.publicAnonKey || DEFAULT_ANON_KEY;

export const SERVER_BASE = `${SUPABASE_URL}/functions/v1/make-server-506b7b3b`;

// Singleton Supabase client (used for auth + session)
let _client: ReturnType<typeof createClient> | null = null;
export function supabase() {
  if (!_client) {
    _client = createClient(SUPABASE_URL, publicAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? publicAnonKey;
}

// ---------- Jeton admin (flux totalement séparé du flux utilisateur) ----------
// Émis par POST /admin/auth/login, envoyé via le header X-Admin-Token sur
// CHAQUE requête quand il est présent. Les routes admin du serveur n'acceptent
// que ce jeton ; un utilisateur Supabase, lui, n'en a jamais.
const ADMIN_TOKEN_LS = 'ippoo_admin_token';
let _adminToken: string | null =
  (typeof localStorage !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_LS) : null);

export function setAdminToken(token: string | null) {
  _adminToken = token;
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_LS, token);
    else localStorage.removeItem(ADMIN_TOKEN_LS);
  } catch { /* stockage indisponible */ }
}
export function getAdminToken(): string | null { return _adminToken; }

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  cache?: boolean;
  // queue=true (default for mutations) re-tries the request once connectivity
  // returns. Set queue=false for payments and other non-idempotent calls
  // where silent replay would be dangerous.
  queue?: boolean;
}

function isNetworkFailure(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return /network|failed to fetch|load failed|networkerror/i.test(e.message);
}

async function sendQueued(entry: QueueEntry): Promise<void> {
  await fetchOnce(entry.path, { method: entry.method, body: entry.body, auth: entry.auth });
}

let listenersInstalled = false;
function ensureDrainListener() {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  const tryDrain = () => { void drain(sendQueued); };
  window.addEventListener('online', tryDrain);
  // Cover tab regains focus after backgrounding (mobile).
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) tryDrain();
  });
  // First drain on boot in case the queue holds entries from a prior session.
  setTimeout(tryDrain, 1500);
}

async function fetchOnce<T>(path: string, opts: ApiOptions): Promise<T> {
  const token = opts.auth === false ? publicAnonKey : await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  // Le jeton admin est transmis en parallèle du Bearer utilisateur. Les routes
  // admin l'exigent ; les routes utilisateur l'ignorent. Les deux flux restent
  // donc strictement indépendants.
  if (_adminToken) headers["X-Admin-Token"] = _adminToken;
  const res = await fetch(`${SERVER_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error ?? `HTTP ${res.status}`;
    console.log(`API ${opts.method ?? "GET"} ${path} failed: ${msg}`, data);
    const err = new Error(msg) as Error & { status?: number; retryAfterSeconds?: number };
    err.status = res.status;
    if (typeof data?.retryAfterSeconds === 'number') err.retryAfterSeconds = data.retryAfterSeconds;
    throw err;
  }
  return data as T;
}

// Retries idempotent requests on transient failure (network blip or 5xx,
// excluding 501/505 which are permanent). 502/503/504 are the typical
// upstream/edge errors worth retrying. POST/PUT/DELETE are never retried
// here — the offline queue handles those — and 429 is honored via
// retryAfterSeconds when the server provides it.
async function fetchWithRetry<T>(path: string, opts: ApiOptions): Promise<T> {
  const method = opts.method ?? "GET";
  const retryable = method === "GET";
  const maxAttempts = retryable ? 3 : 1;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < maxAttempts) {
    try {
      return await fetchOnce<T>(path, opts);
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt >= maxAttempts) break;
      const status = (e as { status?: number })?.status;
      const transient5xx = status === 502 || status === 503 || status === 504;
      const networky = isNetworkFailure(e);
      if (!transient5xx && !networky) break;
      const retryAfter = (e as { retryAfterSeconds?: number })?.retryAfterSeconds;
      const base = retryAfter && retryAfter > 0
        ? retryAfter * 1000
        : 300 * Math.pow(2, attempt - 1); // 300ms, 600ms
      const jitter = Math.random() * 150;
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
  throw lastErr;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  ensureDrainListener();
  const method = opts.method ?? "GET";
  // Mutations that opt-in to queuing fall back to the offline queue when
  // the network is unreachable. The caller receives a synthesized
  // "queued" response so the UI can mark the action as pending.
  const queueable = method !== "GET" && opts.queue !== false && opts.auth !== false;
  if (queueable) {
    try {
      return await fetchOnce<T>(path, opts);
    } catch (e) {
      if (!isNetworkFailure(e)) throw e;
      await enqueue({ path, method, body: opts.body, auth: opts.auth !== false });
      return { queued: true } as unknown as T;
    }
  }
  // GETs go through the retry helper; reuse fetchOnce for everything else.
  // Stale-while-revalidate for cacheable GETs: serve cached payload
  // immediately if present, then refresh in the background. On network
  // failure (offline, 5xx) the cached value is the response.
  const cacheable = method === "GET" && opts.cache !== false && opts.auth === false;
  if (!cacheable) return fetchWithRetry<T>(path, opts);

  const key = `GET ${path}`;
  const cached = await cacheGet<T>(key);
  const network = fetchWithRetry<T>(path, opts).then((fresh) => {
    void cacheSet(key, fresh);
    return fresh;
  });
  if (cached !== undefined) {
    // Kick off the refresh but don't block on it; swallow errors so the
    // UI keeps showing cached data when offline.
    network.catch(() => undefined);
    return cached;
  }
  try {
    return await network;
  } catch (e) {
    // Final fallback if cache was empty: rethrow so callers can show an error.
    throw e;
  }
}

// ============== ADMIN AUTH (séparé du flux utilisateur) ==============
// Ne touche JAMAIS à Supabase Auth : valide les identifiants contre
// ADMIN_EMAILS/ADMIN_PASSWORD côté serveur et récupère un jeton admin signé.
export async function adminLogin(email: string, password: string) {
  const res = await api<{ token: string; email: string; expiresAt: number }>(
    "/admin/auth/login",
    { method: "POST", body: { email, password }, auth: false, queue: false },
  );
  setAdminToken(res.token);
  return res;
}

export async function adminVerify() {
  // Renvoie l'identité admin si le jeton stocké est encore valide, sinon throw.
  return api<{ email: string; role: string }>("/admin/auth/me");
}

export function adminLogout() {
  setAdminToken(null);
}

// ============== AUTH ==============
export async function signUp(email: string, password: string, firstName?: string) {
  await api("/auth/signup", { method: "POST", body: { email, password, firstName }, auth: false });
  return signIn(email, password);
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase().auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "Login failed");
  return data.session;
}

export async function signOut() {
  await supabase().auth.signOut();
}

export async function getMe() {
  return api<{ user: { id: string; email?: string; role: string }; profile: unknown }>("/auth/me");
}

export async function updateMe(patch: Record<string, unknown>) {
  return api<{ profile: unknown }>("/auth/me", { method: "PUT", body: patch });
}

export async function requestPasswordReset(email: string) {
  return api<{ ok: true }>("/auth/password/request", { method: "POST", body: { email }, auth: false });
}

export async function changePassword(newPassword: string) {
  return api<{ ok: true }>("/auth/password/change", { method: "POST", body: { newPassword } });
}

// Completes a password reset. The recovery link from the email lands the user
// on the app with a Supabase recovery session; the client then calls this
// with the new password and Supabase Auth applies it against that session.
export async function completePasswordReset(newPassword: string) {
  const { error } = await supabase().auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

// ============== CONTENT (admin + public reads) ==============
export type Resource =
  | "article" | "episode" | "video" | "short" | "opportunity" | "dossier"
  | "price" | "program" | "page" | "theme" | "push"
  | "wb_post" | "wb_post_reply" | "wb_music" | "wb_track";

export async function listContent<T = unknown>(resource: Resource, opts: { limit?: number; offset?: number } = {}): Promise<T[]> {
  // Default to the server's max page size so existing callers (which assume
  // they get "everything") still get a reasonable snapshot without having
  // to implement pagination upfront. Move to listContentPage() if you need
  // explicit cursors.
  const limit = opts.limit ?? 200;
  const qs = new URLSearchParams({ limit: String(limit), offset: String(opts.offset ?? 0) });
  const { items } = await api<{ items: T[] }>(`/content/${resource}?${qs}`, { auth: false });
  return items ?? [];
}
export async function listContentPage<T = unknown>(resource: Resource, opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams({
    limit: String(opts.limit ?? 50),
    offset: String(opts.offset ?? 0),
  });
  return api<{ items: T[]; total: number; nextOffset: number | null }>(`/content/${resource}?${qs}`, { auth: false });
}
export async function getContent<T = unknown>(resource: Resource, id: string): Promise<T | null> {
  try {
    const { item } = await api<{ item: T }>(`/content/${resource}/${id}`, { auth: false });
    return item;
  } catch { return null; }
}
export async function saveContent<T = unknown>(resource: Resource, id: string, body: T) {
  return api<{ item: T }>(`/content/${resource}/${id}`, { method: "PUT", body });
}
export async function deleteContent(resource: Resource, id: string) {
  return api(`/content/${resource}/${id}`, { method: "DELETE" });
}
export async function bulkUpsert<T = unknown>(resource: Resource, items: T[]) {
  return api<{ ok: boolean; count: number }>(`/content/${resource}/bulk`, { method: "POST", body: { items } });
}
export async function seedContent<T = unknown>(resource: Resource, items: T[]) {
  return api<{ ok: boolean; inserted: number; skipped: number }>(
    `/content/${resource}/seed`, { method: "POST", body: { items } },
  );
}

// ============== CONFIG SINGLETONS ==============
export async function getConfig<T = unknown>(key: string): Promise<T | null> {
  const { item } = await api<{ item: T }>(`/config/${key}`, { auth: false });
  return item;
}
export async function setConfig(key: string, body: unknown) {
  return api(`/config/${key}`, { method: "PUT", body });
}

// ============== SUBSCRIPTIONS / PAYMENTS ==============
export interface Subscription {
  userId: string;
  planId: "monthly" | "yearly";
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  lastTxId: string;
}
export interface TxRecord {
  id: string;
  userId: string;
  planId: "monthly" | "yearly";
  amountXOF: number;
  operator: string;
  phone: string;
  status: "pending" | "success" | "failed" | "cancelled";
  createdAt: string;
}
export async function fetchMySubscription() {
  return api<{ subscription: Subscription | null; transactions: TxRecord[] }>("/subscription/me");
}
export async function cancelMySubscription() {
  return api<{ subscription: Subscription }>("/subscription/cancel", { method: "POST" });
}
export async function initPayment(planId: "monthly" | "yearly", operator: string, phone: string, returnUrl?: string) {
  return api<{ transactionId: string; paymentUrl: string; paymentToken: string }>(
    "/payments/init",
    { method: "POST", body: { planId, operator, phone, returnUrl } },
  );
}
export async function checkPayment(transactionId: string) {
  return api<{ transaction: TxRecord }>(`/payments/${transactionId}`);
}

// ============== STORAGE ==============
export async function uploadFile(path: string, file: Blob | File) {
  const sig = await api<{ uploadUrl: string; path: string; token: string }>(
    "/storage/sign-upload",
    { method: "POST", body: { path, contentType: file.type } },
  );
  const put = await fetch(sig.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
  return sig.path;
}
// Admin-only: upload a media asset to the public CMS bucket. Returns a
// permanent public URL safe to store on content rows (no signing needed).
export async function uploadPublicMedia(file: Blob | File): Promise<{ path: string; url: string; kind: string }> {
  const token = await getAccessToken();
  const ext = (file as File).name?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const qs = ext ? `?ext=${encodeURIComponent(ext)}` : "";
  const res = await fetch(`${SERVER_BASE}/storage/upload-public${qs}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error ?? `Upload failed: ${res.status}`);
  return data as { path: string; url: string; kind: string };
}

export async function signedReadUrl(path: string) {
  const { url } = await api<{ url: string }>(`/storage/sign-read?path=${encodeURIComponent(path)}`);
  return url;
}

// ============== NOTIFICATIONS ==============
export async function sendPushNotification(payload: { title: string; body: string; url?: string; iconKey?: string; color?: string; userId?: string }) {
  return api<{ ok: boolean; sent: number; failed: number; pruned: number }>(
    "/notifications/send", { method: "POST", body: payload },
  );
}

export interface InboxNotif {
  id: string;
  title: string;
  body: string;
  url: string;
  iconKey: 'news' | 'podcast' | 'event' | 'alert' | 'opportunity';
  color: string;
  sentAt: number;
  read: boolean;
  readAt?: number;
}
export async function fetchInbox(opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams({
    limit: String(opts.limit ?? 100),
    offset: String(opts.offset ?? 0),
  });
  return api<{ items: InboxNotif[]; total?: number; nextOffset?: number | null }>(`/notifications/inbox?${qs}`);
}
export async function fetchUnreadCount() {
  return api<{ count: number }>("/notifications/unread-count");
}
export async function markNotifsRead(payload: { ids?: string[]; all?: boolean }) {
  return api<{ ok: boolean; updated: number }>("/notifications/read", { method: "POST", body: payload });
}

// ============== SHARED INTERACTIONS ==============
export type CommentStatus = 'pending' | 'approved' | 'rejected';
export interface ServerComment {
  id: string;
  targetId: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: number;
  likes: number;
  status?: CommentStatus;
  moderatedAt?: number;
  moderatedBy?: string;
}
export async function fetchComments(targetId: string, opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams({
    limit: String(opts.limit ?? 50),
    offset: String(opts.offset ?? 0),
  });
  return api<{ items: ServerComment[]; total?: number; nextOffset?: number | null }>(
    `/interactions/comments/${encodeURIComponent(targetId)}?${qs}`,
    { auth: false },
  );
}
export async function postComment(targetId: string, text: string, author?: string) {
  return api<{ item: ServerComment }>(`/interactions/comments/${encodeURIComponent(targetId)}`, {
    method: 'POST', body: { text, author },
  });
}
export async function deleteComment(targetId: string, id: string) {
  return api(`/interactions/comments/${encodeURIComponent(targetId)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function adminListComments(status?: CommentStatus) {
  const qs = status ? `?status=${status}` : '';
  return api<{ items: ServerComment[] }>(`/admin/comments${qs}`);
}
export async function moderateComment(targetId: string, id: string, status: CommentStatus) {
  return api<{ item: ServerComment }>(
    `/interactions/comments/${encodeURIComponent(targetId)}/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: { status } },
  );
}
export async function toggleCommentLike(targetId: string, id: string) {
  return api<{ item: ServerComment; liked: boolean }>(
    `/interactions/comments/${encodeURIComponent(targetId)}/${encodeURIComponent(id)}/like`,
    { method: 'POST' },
  );
}

export type ServerReactionType = 'like' | 'love' | 'clap' | 'wow' | 'sad' | 'angry';
export async function fetchReactions(targetId: string) {
  return api<{ counts: Partial<Record<ServerReactionType, number>>; mine: ServerReactionType | null; total: number }>(
    `/interactions/reactions/${encodeURIComponent(targetId)}`,
  );
}
export async function setReaction(targetId: string, type: ServerReactionType | null) {
  return api<{ ok: boolean; mine: ServerReactionType | null }>(
    `/interactions/reactions/${encodeURIComponent(targetId)}`,
    { method: 'PUT', body: { type } },
  );
}

// ============== POLLS ==============
export async function fetchPoll(pollId: string) {
  return api<{ counts: Record<string, number>; mine: string | null; total: number }>(
    `/interactions/polls/${encodeURIComponent(pollId)}`,
  );
}
export async function votePoll(pollId: string, optionId: string) {
  return api<{ ok: boolean; mine: string }>(
    `/interactions/polls/${encodeURIComponent(pollId)}/vote`,
    { method: 'POST', body: { optionId } },
  );
}

// ============== VIEW COUNTERS ==============
export async function fetchViewCount(targetId: string) {
  return api<{ total: number }>(`/interactions/views/${encodeURIComponent(targetId)}`);
}
export async function fetchViewCounts(ids: string[]) {
  return api<{ counts: Record<string, number> }>(`/interactions/views`, { method: 'POST', body: { ids } });
}
export async function incrementViewCount(targetId: string) {
  return api<{ total: number; counted: boolean }>(
    `/interactions/views/${encodeURIComponent(targetId)}`,
    { method: 'POST' },
  );
}

// ============== PRIVATE USER DATA ==============
export type UserDataKind = 'favorite' | 'history' | 'mood' | 'search_recent' | 'reaction' | 'emoji_reaction';

export async function fetchUserData<T = unknown>(kind: UserDataKind, opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams({
    limit: String(opts.limit ?? 200),
    offset: String(opts.offset ?? 0),
  });
  return api<{ items: T[]; total?: number; nextOffset?: number | null }>(`/user/data/${kind}?${qs}`);
}
export async function putUserData<T = unknown>(kind: UserDataKind, id: string, body: T) {
  return api<{ item: T }>(`/user/data/${kind}/${encodeURIComponent(id)}`, { method: 'PUT', body });
}
export async function deleteUserData(kind: UserDataKind, id: string) {
  return api(`/user/data/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function clearUserData(kind: UserDataKind) {
  return api(`/user/data/${kind}`, { method: 'DELETE' });
}
export async function bulkUserData<T = unknown>(kind: UserDataKind, items: T[]) {
  return api<{ ok: boolean; count: number }>(`/user/data/${kind}/bulk`, { method: 'POST', body: { items } });
}

// ============== ADMIN ==============
export async function adminStats() {
  return api<{ subscriptions: number; activeSubscriptions: number; transactions: number; successful: number; revenueXOF: number }>("/admin/stats");
}
export async function adminListUsers(opts: { limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams({
    limit: String(opts.limit ?? 100),
    offset: String(opts.offset ?? 0),
  });
  return api<{ users: unknown[]; items?: unknown[]; total?: number; nextOffset?: number | null }>(`/admin/users?${qs}`);
}

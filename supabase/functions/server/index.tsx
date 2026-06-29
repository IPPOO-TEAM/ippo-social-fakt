import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { z } from "npm:zod@3.23.8";
// Data access is now backed by dedicated relational tables (migrations
// 0002/0003/0004) instead of the single kv_store table. db.tsx exposes the
// exact same interface (get/set/del/mget/mset/mdel/getByPrefix) so the routes
// below are unchanged; each key prefix is transparently routed to its table.
import * as kv from "./db.tsx";

// ============== INPUT VALIDATION ==============
// Centralized JSON body parsing + Zod validation. Returns either a Hono
// Response (400) on failure or the parsed, typed data. Every route that
// reads a JSON body should funnel through here.
async function parseBody<S extends z.ZodTypeAny>(c: any, schema: S): Promise<{ ok: true; data: z.infer<S> } | { ok: false; res: Response }> {
  let raw: unknown;
  try { raw = await c.req.json(); }
  catch { return { ok: false, res: c.json({ error: "invalid json" }, 400) }; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return { ok: false, res: c.json({ error: "validation_failed", issues }, 400) };
  }
  return { ok: true, data: parsed.data };
}

// Page bounds applied uniformly to every list endpoint. `kv.getByPrefix`
// reads the whole prefix today, so pagination caps *response* size rather
// than DB scan cost — but it still protects bandwidth, memory, and the
// frontend, and gives us a clean migration path if we move to a paginated
// KV implementation later.
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
function readPage(c: any): { limit: number; offset: number } {
  const lim = Number(c.req.query("limit"));
  const off = Number(c.req.query("offset"));
  const limit = Number.isFinite(lim) ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(lim))) : DEFAULT_LIMIT;
  const offset = Number.isFinite(off) ? Math.max(0, Math.floor(off)) : 0;
  return { limit, offset };
}
function paginate<T>(items: T[], page: { limit: number; offset: number }) {
  const slice = items.slice(page.offset, page.offset + page.limit);
  const nextOffset = page.offset + slice.length < items.length ? page.offset + slice.length : null;
  return { items: slice, total: items.length, nextOffset };
}

// Common reusable schemas.
const EmailSchema = z.string().trim().toLowerCase().email().max(254);
const PasswordSchema = z.string().min(8).max(200);
const PhoneSchema = z.string().min(6).max(20).regex(/^[+0-9 ()-]+$/);
const PlanIdSchema = z.enum(["monthly", "yearly"]);
const RoleSchema = z.enum(["user", "editor", "admin"]);
const ReactionTypeSchema = z.enum(["like", "love", "clap", "wow", "sad", "angry"]);

// ============== STRUCTURED LOGGING + SENTRY ==============
// Structured JSON logs make Supabase log search trivial (filter by `level`,
// `event`, `requestId`). All console.log call sites should migrate to `log()`
// over time; for now both coexist.
const SENTRY_DSN = Deno.env.get("SENTRY_DSN");
const RELEASE = Deno.env.get("RELEASE") ?? "make-server-506b7b3b";
const ENV = Deno.env.get("ENV") ?? "production";

interface LogFields { event: string; level?: "info" | "warn" | "error"; requestId?: string; userId?: string; [k: string]: unknown }
function log(fields: LogFields) {
  try { console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", ...fields })); }
  catch { console.log(`log: ${fields.event}`); }
}

// Lightweight Sentry capture via raw HTTP (no SDK dependency). Sends a
// minimal event compatible with the Sentry envelope endpoint. Fire-and-forget.
function parseDsn(dsn: string): { url: string; auth: string } | null {
  try {
    const m = dsn.match(/^(https?):\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return null;
    const [, proto, key, host, project] = m;
    return {
      url: `${proto}://${host}/api/${project}/store/`,
      auth: `Sentry sentry_version=7, sentry_key=${key}, sentry_client=ippoo-edge/1.0`,
    };
  } catch { return null; }
}
const SENTRY = SENTRY_DSN ? parseDsn(SENTRY_DSN) : null;

function captureException(err: unknown, ctx: Record<string, unknown> = {}): void {
  if (!SENTRY) return;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "error",
    release: RELEASE,
    environment: ENV,
    server_name: "edge-function",
    exception: { values: [{ type: err instanceof Error ? err.name : "Error", value: message, stacktrace: stack ? { frames: parseStack(stack) } : undefined }] },
    tags: { component: "edge" },
    extra: ctx,
  };
  // Fire and forget — never block the request on Sentry latency/failure.
  fetch(SENTRY.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Sentry-Auth": SENTRY.auth },
    body: JSON.stringify(payload),
  }).catch((e) => console.log(`sentry capture failed: ${e}`));
}

function parseStack(stack: string) {
  return stack.split("\n").slice(1, 20).map((line) => {
    const m = line.match(/at (?:(.+?) )?\(?(.+?):(\d+):(\d+)\)?$/);
    return m
      ? { function: m[1] || "?", filename: m[2], lineno: Number(m[3]), colno: Number(m[4]), in_app: true }
      : { function: line.trim(), in_app: true };
  });
}

const app = new Hono();
app.use("*", logger(console.log));

// Tag every request with a stable ID and capture any uncaught error.
app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID().slice(0, 12);
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  const start = Date.now();
  try {
    await next();
    log({
      event: "request",
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      ms: Date.now() - start,
    });
  } catch (err) {
    log({
      event: "request_error", level: "error", requestId,
      method: c.req.method, path: new URL(c.req.url).pathname,
      ms: Date.now() - start, error: err instanceof Error ? err.message : String(err),
    });
    captureException(err, { requestId, method: c.req.method, path: new URL(c.req.url).pathname });
    throw err;
  }
});

app.onError((err, c) => {
  const requestId = c.get("requestId") as string | undefined;
  captureException(err, { requestId, where: "hono.onError" });
  return c.json({ error: "internal", requestId }, 500);
});
// CORS: whitelist via ALLOWED_ORIGINS env (comma-separated). Falls back to
// "*" in dev/when unset so local previews keep working. The CinetPay webhook
// is server-to-server and bypasses CORS entirely.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (ALLOWED_ORIGINS.length === 0) return origin ?? "*";
      if (!origin) return "";
      return ALLOWED_ORIGINS.includes(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "apikey", "X-Request-Id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600,
    credentials: false,
  }),
);

const PREFIX = "/make-server-506b7b3b";
const BUCKET = "make-506b7b3b-media";
const PUBLIC_BUCKET = "make-506b7b3b-public";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

// Base PUBLIQUE (externe) pour les URLs d'assets servis au navigateur. En
// auto-hébergé, SUPABASE_URL pointe souvent vers Kong en interne (injoignable
// depuis l'extérieur) ; on privilégie donc une URL publique explicite.
const PUBLIC_BASE = (
  Deno.env.get("SUPABASE_PUBLIC_URL") ||
  Deno.env.get("STORAGE_PUBLIC_URL") ||
  Deno.env.get("APP_PUBLIC_SUPABASE_URL") ||
  SUPABASE_URL ||
  ""
).replace(/\/+$/, "");

function publicAssetUrl(path: string): string {
  return `${PUBLIC_BASE}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`;
}

// Réécrit toute URL de storage pointant vers un hôte INTERNE (kong/localhost/
// SUPABASE_URL interne) vers la base PUBLIQUE, afin que les assets déjà publiés
// avec une mauvaise URL redeviennent joignables côté navigateur. Idempotent.
function fixAssetUrl(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const i = v.indexOf("/storage/v1/object/");
  if (i <= 0) return v;
  // Garde uniquement le chemin storage et le repréfixe avec la base publique.
  const tail = v.slice(i);
  if (!PUBLIC_BASE) return v;
  return `${PUBLIC_BASE}${tail}`;
}
const ASSET_FIELDS = ["image", "audio", "audioUrl", "video", "videoUrl", "cover", "thumbnail"];
function rewriteAssetUrls<T>(item: T): T {
  if (!item || typeof item !== "object") return item;
  const obj = item as Record<string, unknown>;
  for (const f of ASSET_FIELDS) {
    if (f in obj) obj[f] = fixAssetUrl(obj[f]);
  }
  return item;
}

// Idempotently create both buckets on cold start. Private bucket holds
// user-owned assets (avatars, drafts) gated by signed URLs. Public bucket
// holds CMS media (article images, episode audio, video covers) referenced
// by permanent URLs in the content rows.
(async () => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const have = new Set((buckets ?? []).map((b) => b.name));
    if (!have.has(BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
      console.log(`Created bucket ${BUCKET}`);
    }
    if (!have.has(PUBLIC_BUCKET)) {
      await supabaseAdmin.storage.createBucket(PUBLIC_BUCKET, { public: true });
      console.log(`Created bucket ${PUBLIC_BUCKET}`);
    }
  } catch (e) {
    console.log(`Bucket init error: ${e}`);
  }
})();

// ============== AUTH HELPERS ==============

interface AuthUser { id: string; email?: string; role: string }

async function getUser(req: Request): Promise<AuthUser | null> {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    // Read role from app_metadata only (admin-controlled namespace).
    // user_metadata is client-writable and stripped by the SQL trigger.
    const role = (data.user.app_metadata?.role as string) || "user";
    return { id: data.user.id, email: data.user.email, role };
  } catch (e) {
    console.log(`getUser error: ${e}`);
    return null;
  }
}

async function requireUser(req: Request) {
  const u = await getUser(req);
  if (!u) return { ok: false as const, status: 401, msg: "Unauthorized" };
  return { ok: true as const, user: u };
}

// ============== ADMIN AUTH (FLUX COMPLÈTEMENT SÉPARÉ) ==============
// L'admin n'est PAS un utilisateur Supabase. Il s'authentifie contre une
// liste d'emails autorisés (ADMIN_EMAILS) + un mot de passe partagé
// (ADMIN_PASSWORD), tous deux lus côté serveur uniquement. À la connexion, le
// serveur émet un jeton admin signé (HMAC-SHA256) totalement distinct du JWT
// utilisateur. Un compte utilisateur, quel que soit son rôle, ne peut donc
// JAMAIS accéder à l'admin : les routes admin n'acceptent que ce jeton.
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const ADMIN_SESSION_SECRET =
  Deno.env.get("ADMIN_SESSION_SECRET") ?? Deno.env.get("JWT_SECRET") ?? SERVICE_ROLE;
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

const b64url = {
  enc: (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  dec: (s: string) => {
    const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
  },
};

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(ADMIN_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

// Comparaison à temps constant (anti timing-attack sur le mot de passe).
function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

async function mintAdminToken(email: string): Promise<string> {
  const payload = JSON.stringify({ email, exp: Date.now() + ADMIN_TOKEN_TTL_MS });
  const body = b64url.enc(payload);
  const sig = b64url.enc(await hmac(body));
  return `${body}.${sig}`;
}

async function verifyAdminToken(token: string | undefined | null): Promise<{ email: string } | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const expected = b64url.enc(await hmac(body));
    if (!timingSafeEqual(sig, expected)) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64url.dec(body)));
    if (!payload?.email || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    // Le mail doit TOUJOURS être dans la liste autorisée (révocation instantanée
    // si on retire un email de ADMIN_EMAILS, même si le jeton n'est pas expiré).
    if (!ADMIN_EMAILS.includes(String(payload.email).toLowerCase())) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

// Garde des routes admin : n'accepte QUE le jeton admin (header X-Admin-Token).
// Renvoie une identité admin synthétique (pas un utilisateur Supabase).
async function requireAdmin(req: Request) {
  const token = req.headers.get("X-Admin-Token");
  const admin = await verifyAdminToken(token);
  if (!admin) return { ok: false as const, status: 401, msg: "Admin non autorisé" };
  return {
    ok: true as const,
    user: { id: `admin:${admin.email}`, email: admin.email, role: "admin" as const },
  };
}

// ============== RATE LIMITING ==============
// Fixed-window limiter backed by KV. Each bucket key encodes the window so
// stale buckets simply expire from relevance (we evict opportunistically).
// Not perfect — a burst at window boundary can double the limit briefly —
// but adequate for abuse prevention without Redis.
function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

interface RateResult { ok: boolean; remaining: number; resetMs: number }
async function rateLimit(scope: string, id: string, max: number, windowMs: number): Promise<RateResult> {
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `rate:${scope}:${id}:${bucket}`;
  try {
    const current = Number((await kv.get(key)) ?? 0);
    const next = current + 1;
    await kv.set(key, next);
    const resetMs = (bucket + 1) * windowMs - Date.now();
    return { ok: next <= max, remaining: Math.max(0, max - next), resetMs };
  } catch (e) {
    // KV down — fail open so we don't lock users out, but log it.
    log({ event: "rate_limit.kv_error", level: "warn", scope, id, error: String(e) });
    return { ok: true, remaining: max, resetMs: windowMs };
  }
}

function rateLimitResponse(c: any, r: RateResult) {
  c.header("X-RateLimit-Remaining", String(r.remaining));
  c.header("Retry-After", String(Math.ceil(r.resetMs / 1000)));
  return c.json({ error: "rate_limited", retryAfterSeconds: Math.ceil(r.resetMs / 1000) }, 429);
}

// ============== HEALTH ==============
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok", time: new Date().toISOString() }));

// ============== ADMIN AUTH ROUTES (séparées du flux utilisateur) ==============
// Connexion admin : email ∈ ADMIN_EMAILS + mot de passe == ADMIN_PASSWORD,
// vérifiés côté serveur. Aucun lien avec Supabase Auth. Rate-limité par IP
// et par email pour empêcher le brute-force.
app.post(`${PREFIX}/admin/auth/login`, async (c) => {
  const ip = clientIp(c.req.raw);
  const rlIp = await rateLimit("admin_login_ip", ip, 10, 15 * 60 * 1000);
  if (!rlIp.ok) return rateLimitResponse(c, rlIp);
  const p = await parseBody(c, z.object({
    email: z.string().trim().toLowerCase().max(254),
    password: z.string().min(1).max(200),
  }));
  if (!p.ok) return p.res;
  const { email, password } = p.data;

  const rlEmail = await rateLimit("admin_login_email", email, 5, 15 * 60 * 1000);
  if (!rlEmail.ok) return rateLimitResponse(c, rlEmail);

  // Mauvaise configuration serveur → refuser explicitement plutôt que d'ouvrir.
  if (ADMIN_EMAILS.length === 0 || !ADMIN_PASSWORD) {
    log({ event: "admin_login.misconfigured", level: "error" });
    return c.json({ error: "Admin non configuré sur le serveur." }, 503);
  }

  const emailOk = ADMIN_EMAILS.includes(email);
  const passOk = timingSafeEqual(password, ADMIN_PASSWORD);
  // On évalue toujours les deux pour ne pas révéler lequel a échoué.
  if (!emailOk || !passOk) {
    log({ event: "admin_login.denied", level: "warn", email, ip });
    return c.json({ error: "Identifiants administrateur invalides." }, 401);
  }

  const token = await mintAdminToken(email);
  log({ event: "admin_login.ok", email, ip });
  return c.json({ token, email, expiresAt: Date.now() + ADMIN_TOKEN_TTL_MS });
});

// Vérifie qu'un jeton admin est toujours valide (revalidation au montage UI).
app.get(`${PREFIX}/admin/auth/me`, async (c) => {
  const admin = await verifyAdminToken(c.req.header("X-Admin-Token"));
  if (!admin) return c.json({ error: "invalid" }, 401);
  return c.json({ email: admin.email, role: "admin" });
});

// ============== AUTH ROUTES ==============

app.post(`${PREFIX}/auth/signup`, async (c) => {
  // 5 signups per hour per IP is enough for legit households / shared NATs;
  // anything beyond is almost certainly automation.
  const ip = clientIp(c.req.raw);
  const rl = await rateLimit("signup", ip, 5, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(c, rl);
  const p = await parseBody(c, z.object({
    email: EmailSchema,
    password: PasswordSchema,
    firstName: z.string().trim().max(80).optional(),
  }));
  if (!p.ok) return p.res;
  const { email, password, firstName } = p.data;
  try {
    // Second tier keyed on email — prevents an attacker rotating IPs to
    // hammer a single account into existence.
    const emailRl = await rateLimit("signup_email", email, 3, 60 * 60 * 1000);
    if (!emailRl.ok) return rateLimitResponse(c, emailRl);
    // Role is NEVER taken from the request. New accounts are always 'user'.
    // Promotion to editor/admin happens via /admin/users/:id/role (admin only).
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { firstName: firstName ?? "" },
      app_metadata: { role: "user" },
      email_confirm: true,
    });
    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    await kv.set(`user_profile:${data.user.id}`, {
      id: data.user.id,
      email,
      firstName: firstName ?? "",
      role: "user",
      createdAt: new Date().toISOString(),
    });
    return c.json({ user: { id: data.user.id, email } });
  } catch (e) {
    console.log(`Signup unexpected error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// ============== PASSWORD RESET ==============
// Two-step flow using Supabase Auth's built-in magic link recovery.
//  1) POST /auth/password/request { email }      → emails a recovery link
//  2) Client redirects to APP_URL/reset-password#access_token=...
//  3) Client calls supabase.auth.updateUser({ password }) with that session
// We expose request-link here; the actual password change happens client-side
// against Supabase Auth directly (it requires the user's recovery session).
const PASSWORD_RESET_REDIRECT = Deno.env.get("APP_URL")
  ? `${Deno.env.get("APP_URL")}/reset-password`
  : undefined;

app.post(`${PREFIX}/auth/password/request`, async (c) => {
  const ip = clientIp(c.req.raw);
  const rl = await rateLimit("pwd_reset_ip", ip, 10, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(c, rl);
  const pb = await parseBody(c, z.object({ email: EmailSchema }));
  if (!pb.ok) return pb.res;
  const emailRl = await rateLimit("pwd_reset_email", pb.data.email, 5, 60 * 60 * 1000);
  if (!emailRl.ok) return rateLimitResponse(c, emailRl);
  try {
    // generateLink does not reveal whether the email exists in the body — we
    // simply return ok regardless to avoid an enumeration oracle.
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: pb.data.email,
      options: PASSWORD_RESET_REDIRECT ? { redirectTo: PASSWORD_RESET_REDIRECT } : undefined,
    }).catch((e) => log({ event: "pwd_reset.generate_link_error", level: "warn", error: String(e) }));
    return c.json({ ok: true });
  } catch (e) {
    log({ event: "pwd_reset.error", level: "error", error: String(e) });
    return c.json({ ok: true }); // never leak
  }
});

// Authenticated password change (user already signed in, knows current pwd).
app.post(`${PREFIX}/auth/password/change`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const pb = await parseBody(c, z.object({ newPassword: PasswordSchema }));
  if (!pb.ok) return pb.res;
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(r.user.id, {
      password: pb.data.newPassword,
    });
    if (error) return c.json({ error: error.message }, 400);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Admin-only: promote/demote a user. Role is written to app_metadata,
// which is not editable by the user themselves.
app.put(`${PREFIX}/admin/users/:id/role`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  if (r.user.role !== "admin") return c.json({ error: "admin only" }, 403);
  const id = c.req.param("id");
  const p = await parseBody(c, z.object({ role: RoleSchema }));
  if (!p.ok) return p.res;
  const { role } = p.data;
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata: { role },
    });
    if (error) return c.json({ error: error.message }, 400);
    const profile = (await kv.get(`user_profile:${id}`)) || { id };
    await kv.set(`user_profile:${id}`, { ...profile, role, updatedAt: new Date().toISOString() });
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${PREFIX}/auth/me`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const profile = await kv.get(`user_profile:${r.user.id}`);
  return c.json({ user: r.user, profile });
});

// Profile fields the user may write to. Anything else (id, role, createdAt,
// updatedAt, email) is server-controlled and silently dropped.
const ProfilePatchSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  phone: PhoneSchema.optional(),
  zone: z.string().trim().max(80).optional(),
  language: z.string().trim().max(8).optional(),
  followedSections: z.array(z.string().max(40)).max(50).optional(),
  avatar: z.string().max(500).optional(),
  onboarded: z.boolean().optional(),
}).strict();

app.put(`${PREFIX}/auth/me`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const p = await parseBody(c, ProfilePatchSchema);
  if (!p.ok) return p.res;
  const patch = p.data;
  try {
    const existing = (await kv.get(`user_profile:${r.user.id}`)) || {};
    const merged = { ...existing, ...patch, id: r.user.id, updatedAt: new Date().toISOString() };
    await kv.set(`user_profile:${r.user.id}`, merged);
    return c.json({ profile: merged });
  } catch (e) {
    console.log(`Profile update error for ${r.user.id}: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// ============== GENERIC CONTENT CRUD ==============
// Resource types managed by admin
const RESOURCES = [
  "article", "episode", "video", "short", "opportunity", "dossier",
  "price", "program", "page", "theme", "push",
  "wb_post", "wb_post_reply", "wb_music", "wb_track",
  "ad",
] as const;
type Resource = typeof RESOURCES[number];

function isResource(s: string): s is Resource {
  return (RESOURCES as readonly string[]).includes(s);
}

// Resources that must never be exposed publicly (push targeting, themes,
// raw price config). Only admin/editor can read them.
// Read access. `push` (campagnes ciblées) et `theme` (branding interne) restent
// privés ; `price` est PUBLIC (indice des prix conso affiché à tous). Les
// écritures de toutes les ressources passent par requireAdmin (route PUT).
const ADMIN_ONLY_RESOURCES = new Set<Resource>(["push", "theme"]);

// Ressources dont la première publication déclenche une notification globale.
const NOTIFY_RESOURCES = new Set<Resource>([
  "article", "episode", "video", "short", "opportunity", "dossier",
]);
const NOTIFY_META: Record<string, { label: string; iconKey: "news" | "podcast" | "event" | "alert" | "opportunity"; color: string; url?: (id: string) => string }> = {
  article:     { label: "Nouvel article", iconKey: "news",        color: "#0066FF", url: (id) => `/article/${id}` },
  episode:     { label: "Nouvel épisode", iconKey: "podcast",     color: "#9B51E0", url: (id) => `/podcast` },
  video:       { label: "Nouvelle vidéo", iconKey: "news",        color: "#FF3FA4", url: (id) => `/videos` },
  short:       { label: "Nouveau short",  iconKey: "news",        color: "#FF8A00", url: (id) => `/shorts/${id}` },
  opportunity: { label: "Nouvelle opportunité", iconKey: "opportunity", color: "#00C853", url: (id) => `/services` },
  dossier:     { label: "Nouveau dossier", iconKey: "event",      color: "#0066FF", url: (id) => `/dossier/${id}` },
};

function isPublished(item: any): boolean {
  if (!item) return false;
  if (item.status && item.status !== "published") return false;
  if (item.published === false) return false;
  if (item.draft === true) return false;
  if (item.publishAt && Date.parse(item.publishAt) > Date.now()) return false;
  return true;
}

// Public list — filtered to published items only for non-admin callers.
app.get(`${PREFIX}/content/:resource`, async (c) => {
  const resource = c.req.param("resource");
  if (!isResource(resource)) return c.json({ error: "unknown resource" }, 404);
  const caller = await getUser(c.req.raw);
  const isAdmin = caller?.role === "admin" || caller?.role === "editor";
  if (ADMIN_ONLY_RESOURCES.has(resource) && !isAdmin) {
    return c.json({ error: "forbidden" }, 403);
  }
  try {
    const items = await kv.getByPrefix(`${resource}:`);
    const visible = isAdmin ? items : items.filter(isPublished);
    // Newest first by createdAt/updatedAt when present, else stable order.
    visible.sort((a: any, b: any) => {
      const ta = Date.parse(a?.updatedAt ?? a?.createdAt ?? "") || 0;
      const tb = Date.parse(b?.updatedAt ?? b?.createdAt ?? "") || 0;
      return tb - ta;
    });
    visible.forEach(rewriteAssetUrls);
    const page = readPage(c);
    return c.json(paginate(visible, page));
  } catch (e) {
    console.log(`List ${resource} error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${PREFIX}/content/:resource/:id`, async (c) => {
  const resource = c.req.param("resource");
  if (!isResource(resource)) return c.json({ error: "unknown resource" }, 404);
  const id = c.req.param("id");
  const caller = await getUser(c.req.raw);
  const isAdmin = caller?.role === "admin" || caller?.role === "editor";
  if (ADMIN_ONLY_RESOURCES.has(resource) && !isAdmin) {
    return c.json({ error: "forbidden" }, 403);
  }
  const item = await kv.get(`${resource}:${id}`);
  if (!item) return c.json({ error: "not found" }, 404);
  if (!isAdmin && !isPublished(item)) return c.json({ error: "not found" }, 404);
  return c.json({ item: rewriteAssetUrls(item) });
});

// Admin write — create/update
app.put(`${PREFIX}/content/:resource/:id`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const resource = c.req.param("resource");
  if (!isResource(resource)) return c.json({ error: "unknown resource" }, 404);
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const existing = (await kv.get(`${resource}:${id}`)) || {};
    const merged = { ...existing, ...body, id, updatedAt: new Date().toISOString(), updatedBy: r.user.id };
    if (!existing.createdAt) merged.createdAt = merged.updatedAt;

    // Auto-notification : à la PREMIÈRE publication d'un contenu destiné au
    // public, on prévient tous les utilisateurs (inbox + push). Idempotent via
    // le drapeau `notifiedAt` → une réédition ne renotifie pas.
    const isPublished = merged.published !== false;
    const alreadyNotified = !!existing.notifiedAt;
    if (NOTIFY_RESOURCES.has(resource) && isPublished && !alreadyNotified) {
      merged.notifiedAt = merged.updatedAt;
    }
    await kv.set(`${resource}:${id}`, merged);

    if (NOTIFY_RESOURCES.has(resource) && isPublished && !alreadyNotified) {
      const meta = NOTIFY_META[resource] ?? { label: "Nouveau contenu", iconKey: "news" as const, color: "#0066FF" };
      broadcastNotification({
        title: meta.label,
        body: String(merged.title ?? "Découvrez la nouvelle publication"),
        url: meta.url ? meta.url(id) : "/",
        iconKey: meta.iconKey,
        color: meta.color,
      }).catch((e) => console.log(`auto-notify ${resource}:${id} failed: ${e}`));
    }
    return c.json({ item: merged });
  } catch (e) {
    console.log(`Save ${resource}:${id} error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${PREFIX}/content/:resource/:id`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const resource = c.req.param("resource");
  if (!isResource(resource)) return c.json({ error: "unknown resource" }, 404);
  const id = c.req.param("id");
  try {
    await kv.del(`${resource}:${id}`);
    return c.json({ ok: true });
  } catch (e) {
    console.log(`Delete ${resource}:${id} error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// Idempotent seed: only writes items that don't already exist. Admin uses
// this once to populate an empty database from the client-side seed module
// without overwriting subsequent edits.
app.post(`${PREFIX}/content/:resource/seed`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const resource = c.req.param("resource");
  if (!isResource(resource)) return c.json({ error: "unknown resource" }, 404);
  try {
    const body = await c.req.json();
    if (!Array.isArray(body.items)) return c.json({ error: "items[] required" }, 400);
    const existing = await kv.getByPrefix(`${resource}:`);
    const existingIds = new Set(existing.map((x: any) => x?.id).filter(Boolean));
    const ts = new Date().toISOString();
    const keys: string[] = [];
    const values: unknown[] = [];
    let skipped = 0;
    for (const it of body.items) {
      if (!it?.id) continue;
      if (existingIds.has(it.id)) { skipped++; continue; }
      keys.push(`${resource}:${it.id}`);
      values.push({ ...it, status: it.status ?? "published", createdAt: ts, updatedAt: ts, updatedBy: r.user.id });
    }
    if (keys.length) await kv.mset(keys, values);
    return c.json({ ok: true, inserted: keys.length, skipped });
  } catch (e) {
    console.log(`Seed ${resource} error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// Bulk import (admin) — used to seed
app.post(`${PREFIX}/content/:resource/bulk`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const resource = c.req.param("resource");
  if (!isResource(resource)) return c.json({ error: "unknown resource" }, 404);
  try {
    const body = await c.req.json();
    if (!Array.isArray(body.items)) return c.json({ error: "items[] required" }, 400);
    const ts = new Date().toISOString();
    const keys: string[] = [];
    const values: unknown[] = [];
    for (const it of body.items) {
      const id = it.id ?? crypto.randomUUID();
      keys.push(`${resource}:${id}`);
      values.push({ ...it, id, updatedAt: ts, updatedBy: r.user.id });
    }
    await kv.mset(keys, values);
    return c.json({ ok: true, count: keys.length });
  } catch (e) {
    console.log(`Bulk ${resource} error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// Public RSS feed of published articles. Cached at the edge for 5 min so it
// scales when news aggregators poll. Returns application/rss+xml.
function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
app.get(`${PREFIX}/rss/articles.xml`, async (c) => {
  try {
    const items = (await kv.getByPrefix('article:')).filter(isPublished);
    items.sort((a: any, b: any) => {
      const ta = Date.parse(a?.publishedAt ?? a?.updatedAt ?? a?.createdAt ?? '') || 0;
      const tb = Date.parse(b?.publishedAt ?? b?.updatedAt ?? b?.createdAt ?? '') || 0;
      return tb - ta;
    });
    const top = items.slice(0, 50);
    const site = 'https://ippoo.app';
    const now = new Date().toUTCString();
    const entries = top.map((a: any) => {
      const link = `${site}/article/${encodeURIComponent(a.id)}`;
      const pub = new Date(a.publishedAt ?? a.updatedAt ?? a.createdAt ?? Date.now()).toUTCString();
      return `    <item>
      <title>${xmlEscape(a.title ?? 'Sans titre')}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${xmlEscape(a.excerpt ?? a.subtitle ?? '')}</description>${a.image ? `\n      <enclosure url="${xmlEscape(a.image)}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>IPPOO Social-Fact · Actualités</title>
    <link>${site}</link>
    <description>Le média communautaire ivoirien — fil d'actualités.</description>
    <language>fr</language>
    <lastBuildDate>${now}</lastBuildDate>
${entries}
  </channel>
</rss>`;
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.log(`RSS error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// Singletons (sections config, etc.) — keyed config blob
app.get(`${PREFIX}/config/:key`, async (c) => {
  const key = c.req.param("key");
  const item = await kv.get(`config:${key}`);
  return c.json({ item: item ?? null });
});

app.put(`${PREFIX}/config/:key`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const key = c.req.param("key");
  try {
    const body = await c.req.json();
    await kv.set(`config:${key}`, { ...body, updatedAt: new Date().toISOString(), updatedBy: r.user.id });
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== STORAGE (avatars, media) ==============
// Returns a short-lived signed URL for upload, plus the eventual signed read URL
app.post(`${PREFIX}/storage/sign-upload`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  try {
    const { path, contentType } = await c.req.json();
    if (!path) return c.json({ error: "path required" }, 400);
    const fullPath = `${r.user.id}/${path}`;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(fullPath);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ uploadUrl: data.signedUrl, path: fullPath, token: data.token, contentType: contentType ?? "application/octet-stream" });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Admin upload: posts a binary body to the public CMS bucket and returns the
// permanent public URL. Path is auto-prefixed with `<kind>/` (image, audio,
// video, file) for tidy organization. Caller may set ?ext=mp3 to control the
// filename extension when the Content-Type isn't enough.
app.post(`${PREFIX}/storage/upload-public`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const rl = await rateLimit("storage_upload", r.user.id, 120, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(c, rl);
  try {
    const contentType = c.req.header("content-type") ?? "application/octet-stream";
    const ext = (c.req.query("ext") ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    const kind = contentType.startsWith("image/") ? "image"
      : contentType.startsWith("audio/") ? "audio"
      : contentType.startsWith("video/") ? "video"
      : "file";
    const guessedExt = ext || contentType.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "") || "bin";
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${guessedExt}`;
    const path = `${kind}/${name}`;
    const body = await c.req.arrayBuffer();
    if (!body.byteLength) return c.json({ error: "empty body" }, 400);
    // Cap server-side too: 80MB matches the client's MediaUpload video cap.
    if (body.byteLength > 80 * 1024 * 1024) return c.json({ error: "file too large" }, 413);
    const { error } = await supabaseAdmin.storage.from(PUBLIC_BUCKET).upload(path, body, {
      contentType, upsert: false, cacheControl: "public, max-age=31536000, immutable",
    });
    if (error) return c.json({ error: error.message }, 500);
    // En auto-hébergé, `SUPABASE_URL` côté serveur est souvent l'URL INTERNE
    // (http://kong:8000) → getPublicUrl renverrait une URL injoignable par le
    // navigateur des utilisateurs. On construit donc l'URL à partir d'une base
    // PUBLIQUE explicite (domaine externe).
    return c.json({ path, url: publicAssetUrl(path), kind });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${PREFIX}/storage/sign-read`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const path = c.req.query("path");
  if (!path) return c.json({ error: "path required" }, 400);
  // Owner-or-admin only. Paths are stored as `<userId>/...` by sign-upload.
  const isAdmin = r.user.role === "admin" || r.user.role === "editor";
  const ownerPrefix = `${r.user.id}/`;
  if (!isAdmin && !path.startsWith(ownerPrefix)) {
    return c.json({ error: "forbidden" }, 403);
  }
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ url: data.signedUrl });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== SUBSCRIPTIONS & CINETPAY PAYMENTS ==============

interface Plan { id: "monthly" | "yearly"; label: string; amountXOF: number; days: number }
const PLANS: Plan[] = [
  { id: "monthly", label: "Premium mensuel", amountXOF: 1000, days: 30 },
  { id: "yearly", label: "Premium annuel", amountXOF: 10000, days: 365 },
];

function planOf(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

const CINETPAY_API_KEY = Deno.env.get("CINETPAY_API_KEY");
const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID");
const CINETPAY_SECRET = Deno.env.get("CINETPAY_SECRET_KEY");
const CINETPAY_NOTIFY_URL = `${SUPABASE_URL}/functions/v1/make-server-506b7b3b/payments/cinetpay-webhook`;

app.get(`${PREFIX}/subscription/me`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const sub = await kv.get(`subscription:${r.user.id}`);
  const txs = await kv.getByPrefix(`transaction:${r.user.id}:`);
  return c.json({ subscription: sub ?? null, transactions: txs });
});

app.post(`${PREFIX}/subscription/cancel`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const sub = await kv.get(`subscription:${r.user.id}`);
  if (!sub) return c.json({ error: "no active subscription" }, 404);
  const next = { ...sub, autoRenew: false, updatedAt: new Date().toISOString() };
  await kv.set(`subscription:${r.user.id}`, next);
  return c.json({ subscription: next });
});

// Initialize a Mobile Money payment via CinetPay
app.post(`${PREFIX}/payments/init`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  // Cap payment initiations per user. CinetPay charges per transaction and
  // a buggy/abusive client could otherwise create thousands of pending tx.
  const userRl = await rateLimit("payment_init", r.user.id, 10, 60 * 60 * 1000);
  if (!userRl.ok) return rateLimitResponse(c, userRl);
  const ipRl = await rateLimit("payment_init_ip", clientIp(c.req.raw), 30, 60 * 60 * 1000);
  if (!ipRl.ok) return rateLimitResponse(c, ipRl);
  const pb = await parseBody(c, z.object({
    planId: PlanIdSchema,
    operator: z.string().trim().min(1).max(40),
    phone: PhoneSchema,
    returnUrl: z.string().url().max(500).optional(),
  }));
  if (!pb.ok) return pb.res;
  try {
    const { planId, operator, phone, returnUrl } = pb.data;
    const plan = planOf(planId);
    if (!plan) return c.json({ error: "invalid plan" }, 400);
    if (!CINETPAY_API_KEY || !CINETPAY_SITE_ID) {
      return c.json({ error: "Payment provider not configured. Please set CINETPAY_API_KEY and CINETPAY_SITE_ID." }, 503);
    }

    const transactionId = `IPP-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const pending = {
      id: transactionId, userId: r.user.id, planId, operator, phone,
      amountXOF: plan.amountXOF, status: "pending" as const,
      createdAt: new Date().toISOString(), provider: "cinetpay",
    };
    await kv.set(`transaction:${r.user.id}:${transactionId}`, pending);
    await kv.set(`transaction_lookup:${transactionId}`, { userId: r.user.id });

    const payload = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: plan.amountXOF,
      currency: "XOF",
      description: `IPPOO ${plan.label}`,
      notify_url: CINETPAY_NOTIFY_URL,
      return_url: returnUrl ?? "",
      channels: "MOBILE_MONEY",
      lang: "FR",
      customer_id: r.user.id,
      customer_email: r.user.email ?? "",
      customer_phone_number: phone,
    };

    const resp = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (data?.code !== "201" && data?.code !== 201) {
      log({ event: "payment_init_failed", level: "error", transactionId, userId: r.user.id, cinetpayCode: data?.code, cinetpayMessage: data?.message });
      captureException(new Error(`CinetPay init failed: ${data?.message ?? "unknown"}`), { transactionId, userId: r.user.id, cinetpayResponse: data });
      await kv.set(`transaction:${r.user.id}:${transactionId}`, { ...pending, status: "failed", error: data?.message ?? "init failed" });
      return c.json({ error: data?.message ?? "Payment init failed", details: data }, 502);
    }
    return c.json({
      transactionId,
      paymentUrl: data.data?.payment_url,
      paymentToken: data.data?.payment_token,
    });
  } catch (e) {
    console.log(`Payment init error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// Verify CinetPay HMAC-SHA256 signature delivered in the `x-token` header.
// Reference: https://docs.cinetpay.com/api/1.0-fr/checkout/notification#signature
async function verifyCinetpaySignature(
  form: Record<string, unknown>,
  headerToken: string | null,
): Promise<boolean> {
  if (!CINETPAY_SECRET || !headerToken) return false;
  const fields = [
    "cpm_site_id", "cpm_trans_id", "cpm_trans_date", "cpm_amount", "cpm_currency",
    "signature", "payment_method", "cel_phone_num", "cpm_phone_prefixe",
    "cpm_language", "cpm_version", "cpm_payment_config", "cpm_page_action",
    "cpm_custom", "cpm_designation", "cpm_error_message",
  ];
  const data = fields.map((k) => (form[k] ?? "").toString()).join("");
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(CINETPAY_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  // Constant-time compare to avoid timing oracles.
  const a = hex.toLowerCase();
  const b = headerToken.toLowerCase();
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// CinetPay webhook — server-to-server, verifies status by re-checking.
// IMPORTANT: always returns 200 OK once we've recorded our decision, so
// CinetPay does not keep retrying. Errors before our decision (signature
// failure, unknown tx) return 4xx so CinetPay can flag them.
app.post(`${PREFIX}/payments/cinetpay-webhook`, async (c) => {
  try {
    const form = (await c.req.parseBody().catch(() => null))
      ?? (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const transactionId = (form as any).cpm_trans_id ?? (form as any).transaction_id;
    if (!transactionId) return c.json({ error: "missing transaction id" }, 400);

    if (!CINETPAY_API_KEY || !CINETPAY_SITE_ID || !CINETPAY_SECRET) {
      console.log("Webhook: CinetPay env not configured (need API_KEY, SITE_ID, SECRET_KEY)");
      return c.json({ error: "Payment provider not configured" }, 503);
    }

    // 1) HMAC signature check on the inbound payload.
    const headerToken = c.req.header("x-token") ?? c.req.header("X-TOKEN") ?? null;
    const sigOk = await verifyCinetpaySignature(form as Record<string, unknown>, headerToken);
    if (!sigOk) {
      console.log(`Webhook signature mismatch for tx=${transactionId}`);
      return c.json({ error: "invalid signature" }, 401);
    }

    // 2) Replay protection. A signed, valid webhook payload can be re-sent
    // by an attacker who captured it; we record (txid, signature) markers
    // with a 24h TTL so duplicates short-circuit. The downstream tx.status
    // === "success" check below is a second line of defense for activations
    // specifically, but this guards every kind of replay (failed, pending).
    const replayKey = `seen_webhook:${transactionId}:${(headerToken ?? "nosig").slice(0, 32)}`;
    const seen = await kv.get(replayKey);
    if (seen) {
      log({ event: "webhook_replay_blocked", transactionId });
      return c.json({ ok: true, status: "replay_ignored" });
    }
    const replayExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await kv.set(replayKey, { at: Date.now(), expiresAt: replayExpiresAt });

    // Re-verify via CinetPay check endpoint (do NOT trust the webhook payload alone)
    const check = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
      }),
    });
    const verify = await check.json();
    const status = String(verify?.data?.status ?? "").toUpperCase();

    const lookup = await kv.get(`transaction_lookup:${transactionId}`);
    if (!lookup) return c.json({ error: "unknown transaction" }, 404);
    const userId = lookup.userId as string;
    const tx = await kv.get(`transaction:${userId}:${transactionId}`);
    if (!tx) return c.json({ error: "transaction not found" }, 404);

    // Idempotency: if we already activated this tx, don't extend the
    // subscription again on a webhook retry.
    if (tx.status === "success") {
      return c.json({ ok: true, status: "already_processed" });
    }

    if (status === "ACCEPTED" || status === "SUCCESS") {
      const plan = planOf(tx.planId);
      if (!plan) return c.json({ error: "invalid plan on tx" }, 500);
      // Defense in depth: confirm the provider charged the expected amount/currency.
      const paidAmount = Number(verify?.data?.amount ?? 0);
      const paidCurrency = String(verify?.data?.currency ?? "").toUpperCase();
      if (paidAmount !== plan.amountXOF || (paidCurrency && paidCurrency !== "XOF")) {
        log({ event: "webhook_amount_mismatch", level: "error", transactionId, userId, expected: plan.amountXOF, got: paidAmount, currency: paidCurrency });
        captureException(new Error("CinetPay webhook amount mismatch"), { transactionId, userId, expected: plan.amountXOF, got: paidAmount, currency: paidCurrency });
        await kv.set(`transaction:${userId}:${transactionId}`, {
          ...tx, status: "failed", providerStatus: status,
          providerMessage: `amount mismatch: ${paidAmount} ${paidCurrency}`,
        });
        return c.json({ ok: true, status: "amount_mismatch" });
      }
      const updatedTx = { ...tx, status: "success", paidAt: new Date().toISOString(), providerStatus: status };
      await kv.set(`transaction:${userId}:${transactionId}`, updatedTx);

      const now = new Date();
      const expires = new Date(now);
      expires.setDate(expires.getDate() + plan.days);
      const sub = {
        userId,
        planId: tx.planId,
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        autoRenew: true,
        lastTxId: transactionId,
        updatedAt: now.toISOString(),
      };
      await kv.set(`subscription:${userId}`, sub);
      return c.json({ ok: true, status: "activated" });
    }

    const updatedTx = { ...tx, status: "failed", providerStatus: status, providerMessage: verify?.message };
    await kv.set(`transaction:${userId}:${transactionId}`, updatedTx);
    return c.json({ ok: true, status: "failed" });
  } catch (e) {
    console.log(`Webhook unexpected error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// Manual status check from the client (polling fallback)
app.get(`${PREFIX}/payments/:transactionId`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const transactionId = c.req.param("transactionId");
  const tx = await kv.get(`transaction:${r.user.id}:${transactionId}`);
  if (!tx) return c.json({ error: "not found" }, 404);
  return c.json({ transaction: tx });
});

// ============== WEB PUSH NOTIFICATIONS ==============

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@ippoo.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    console.log(`VAPID setup error: ${e}`);
  }
}

// Public — frontend needs the VAPID public key to subscribe.
app.get(`${PREFIX}/notifications/vapid-key`, (c) => {
  if (!VAPID_PUBLIC) return c.json({ error: "push not configured" }, 503);
  return c.json({ publicKey: VAPID_PUBLIC });
});

// Authenticated user registers their PushSubscription.
const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().max(200),
    auth: z.string().max(200),
  }).passthrough(),
}).passthrough();

app.post(`${PREFIX}/notifications/subscribe`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const pb = await parseBody(c, PushSubscriptionSchema);
  if (!pb.ok) return pb.res;
  try {
    const sub = pb.data;
    // Key by endpoint hash so the same device updates instead of duplicating.
    const enc = new TextEncoder().encode(sub.endpoint);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const id = Array.from(new Uint8Array(buf)).slice(0, 12)
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    await kv.set(`push_sub:${r.user.id}:${id}`, {
      userId: r.user.id, subscription: sub, createdAt: new Date().toISOString(),
    });
    return c.json({ ok: true, id });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/notifications/unsubscribe`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const pb = await parseBody(c, z.object({ endpoint: z.string().url().max(2000) }));
  if (!pb.ok) return pb.res;
  try {
    const { endpoint } = pb.data;
    const enc = new TextEncoder().encode(endpoint);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const id = Array.from(new Uint8Array(buf)).slice(0, 12)
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    await kv.del(`push_sub:${r.user.id}:${id}`);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Reusable fan-out helper. Writes the notification to every targeted user's
// inbox (Realtime table → the bell + floating toast update instantly, no
// external service needed) and ALSO sends a Web Push best-effort when VAPID is
// configured. Push being unavailable never blocks the in-app delivery.
interface BroadcastInput {
  title: string; body: string; url?: string;
  iconKey?: "news" | "podcast" | "event" | "alert" | "opportunity";
  color?: string; userId?: string;
}
async function broadcastNotification(input: BroadcastInput): Promise<{ inbox: number; sent: number; failed: number; pruned: number }> {
  const notifId = `n-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
  const inboxEntry = {
    id: notifId, title: input.title, body: input.body, url: input.url ?? "/",
    iconKey: input.iconKey ?? "news", color: input.color ?? "#0066FF",
    sentAt: Date.now(), read: false,
  };

  // 1) Inbox fan-out (always — works even without push permission/VAPID).
  let inbox = 0;
  if (input.userId) {
    await kv.set(`notif_inbox:${input.userId}:${notifId}`, { ...inboxEntry, userId: input.userId });
    inbox = 1;
  } else {
    const profiles = await kv.getByPrefix("user_profile:") as Array<{ id?: string }>;
    const ids = profiles.map((p) => p?.id).filter((id): id is string => typeof id === "string");
    if (ids.length) {
      const keys = ids.map((id) => `notif_inbox:${id}:${notifId}`);
      const values = ids.map((id) => ({ ...inboxEntry, userId: id }));
      await kv.mset(keys, values);
      inbox = ids.length;
    }
  }

  // 2) Web Push best-effort (skipped silently if VAPID not configured).
  let sent = 0, failed = 0; const stale: string[] = [];
  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    const prefix = input.userId ? `push_sub:${input.userId}:` : "push_sub:";
    const subs = await kv.getByPrefix(prefix);
    const payload = JSON.stringify({ title: input.title, body: input.body, url: input.url ?? "/" });
    await Promise.all(subs.map(async (s: any) => {
      try { await webpush.sendNotification(s.subscription, payload); sent++; }
      catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          const ep = s.subscription?.endpoint;
          if (ep) {
            const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ep))
              .then((b) => Array.from(new Uint8Array(b)).slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join(""));
            stale.push(`push_sub:${s.userId}:${h}`);
          }
        } else { console.log(`push send error: ${err?.message ?? err}`); }
        failed++;
      }
    }));
    if (stale.length) { try { await kv.mdel(stale); } catch { /* ignore */ } }
  }
  return { inbox, sent, failed, pruned: stale.length };
}

// Admin — broadcast or target a user.
// body: { title, body, url?, iconKey?, color?, userId? }
app.post(`${PREFIX}/notifications/send`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  // No VAPID gate: in-app inbox delivery works without external push.
  const sendRl = await rateLimit("push_send", r.user.id, 60, 60 * 60 * 1000);
  if (!sendRl.ok) return rateLimitResponse(c, sendRl);
  const pb = await parseBody(c, z.object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(500),
    url: z.string().max(500).optional(),
    iconKey: z.enum(["news", "podcast", "event", "alert", "opportunity"]).optional(),
    color: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).optional(),
    userId: z.string().uuid().optional(),
  }));
  if (!pb.ok) return pb.res;
  try {
    const res = await broadcastNotification(pb.data);
    return c.json({ ok: true, ...res });
  } catch (e) {
    console.log(`notifications/send error: ${e}`);
    return c.json({ error: String(e) }, 500);
  }
});

// ============== NOTIFICATIONS — USER INBOX ==============

app.get(`${PREFIX}/notifications/inbox`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  try {
    const items = await kv.getByPrefix(`notif_inbox:${r.user.id}:`);
    (items as Array<{ sentAt?: number }>).sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0));
    return c.json(paginate(items, readPage(c)));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.get(`${PREFIX}/notifications/unread-count`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  try {
    const items = await kv.getByPrefix(`notif_inbox:${r.user.id}:`) as Array<{ read?: boolean }>;
    const count = items.filter((n) => !n?.read).length;
    return c.json({ count });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// body: { ids?: string[]; all?: boolean }
app.post(`${PREFIX}/notifications/read`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const pb = await parseBody(c, z.object({
    ids: z.array(z.string().max(80)).max(500).optional(),
    all: z.boolean().optional(),
  }));
  if (!pb.ok) return pb.res;
  try {
    const { ids, all } = pb.data;
    const items = await kv.getByPrefix(`notif_inbox:${r.user.id}:`) as Array<{ id?: string; read?: boolean }>;
    const targetIds = new Set<string>(all ? items.map((n) => n.id ?? "") : (ids ?? []));
    const keys: string[] = [];
    const values: unknown[] = [];
    for (const n of items) {
      if (!n?.id || !targetIds.has(n.id) || n.read) continue;
      keys.push(`notif_inbox:${r.user.id}:${n.id}`);
      values.push({ ...n, read: true, readAt: Date.now() });
    }
    if (keys.length) await kv.mset(keys, values);
    return c.json({ ok: true, updated: keys.length });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== SHARED CONTENT INTERACTIONS ==============
// Comments and emoji reactions live in a shared namespace keyed by target
// content id. Anyone can read; only authenticated users can write; deletion
// is limited to the author or admin/editor.
//
// Keys:
//   comment:<targetId>:<commentId>            → full comment record
//   comment_like:<commentId>:<userId>         → marker for per-user like
//   reaction:<targetId>:<userId>              → single emoji reaction per user/target

const MAX_COMMENT_LEN = 2000;
const MAX_AUTHOR_LEN = 80;

function safeTargetId(s: string): string | null {
  if (!s || s.length > 200) return null;
  if (!/^[a-zA-Z0-9_:-]+$/.test(s)) return null;
  return s;
}

app.get(`${PREFIX}/interactions/comments/:targetId`, async (c) => {
  const targetId = safeTargetId(c.req.param("targetId"));
  if (!targetId) return c.json({ error: "invalid targetId" }, 400);
  try {
    const caller = await getUser(c.req.raw);
    const isAdmin = caller?.role === "admin" || caller?.role === "editor";
    const all = await kv.getByPrefix(`comment:${targetId}:`);
    // Non-admins never see rejected comments. Pending shows to its author
    // (so they don't think their post vanished) plus admins.
    const items = isAdmin ? all : all.filter((it: any) => {
      const st = it?.status ?? 'approved';
      if (st === 'approved') return true;
      if (st === 'pending') return caller && it?.authorId === caller.id;
      return false;
    });
    items.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json(paginate(items, readPage(c)));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Admin-only: cross-target comment listing for the moderation queue.
// Filterable by ?status=pending|approved|rejected. No pagination here yet —
// the queue volume should stay manageable; switch to paginate() once
// comment counts grow past a few hundred.
app.get(`${PREFIX}/admin/comments`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const status = c.req.query("status");
  try {
    const all = await kv.getByPrefix(`comment:`);
    const filtered = status
      ? all.filter((it: any) => (it?.status ?? 'approved') === status)
      : all;
    filtered.sort((a: any, b: any) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
    return c.json({ items: filtered });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Admin moderation: flip a comment's status. The author can always delete
// their own comment via DELETE; this endpoint lets staff hide without
// destroying evidence.
app.patch(`${PREFIX}/interactions/comments/:targetId/:id/status`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const targetId = safeTargetId(c.req.param("targetId"));
  const id = c.req.param("id");
  if (!targetId || !id) return c.json({ error: "invalid" }, 400);
  const pb = await parseBody(c, z.object({ status: z.enum(['pending', 'approved', 'rejected']) }));
  if (!pb.ok) return pb.res;
  try {
    const existing: any = await kv.get(`comment:${targetId}:${id}`);
    if (!existing) return c.json({ error: "not found" }, 404);
    const updated = {
      ...existing,
      status: pb.data.status,
      moderatedAt: Date.now(),
      moderatedBy: r.user.id,
    };
    await kv.set(`comment:${targetId}:${id}`, updated);
    return c.json({ item: updated });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/interactions/comments/:targetId`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const targetId = safeTargetId(c.req.param("targetId"));
  if (!targetId) return c.json({ error: "invalid targetId" }, 400);
  // 20 comments/hour/user is generous for real engagement and harsh for
  // spammers. Separate scope from likes/reactions which are higher-volume.
  const rl = await rateLimit("comment_post", r.user.id, 20, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(c, rl);
  const pb = await parseBody(c, z.object({
    text: z.string().trim().min(1).max(MAX_COMMENT_LEN),
    author: z.string().trim().max(MAX_AUTHOR_LEN).optional(),
  }));
  if (!pb.ok) return pb.res;
  try {
    const { text: trimmed, author } = pb.data;
    const authorName = (author?.trim() || "Anonyme");
    const id = `c-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const comment = {
      id, targetId, text: trimmed, author: authorName,
      authorId: r.user.id,
      createdAt: Date.now(),
      likes: 0,
      status: 'approved' as const,
    };
    await kv.set(`comment:${targetId}:${id}`, comment);
    return c.json({ item: comment });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${PREFIX}/interactions/comments/:targetId/:id`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const targetId = safeTargetId(c.req.param("targetId"));
  const id = c.req.param("id");
  if (!targetId || !id) return c.json({ error: "invalid" }, 400);
  try {
    const existing: any = await kv.get(`comment:${targetId}:${id}`);
    if (!existing) return c.json({ error: "not found" }, 404);
    const isOwner = existing.authorId === r.user.id;
    const isAdmin = r.user.role === "admin" || r.user.role === "editor";
    if (!isOwner && !isAdmin) return c.json({ error: "forbidden" }, 403);
    await kv.del(`comment:${targetId}:${id}`);
    // Best-effort cleanup of per-user like markers.
    const likes = await kv.getByPrefix(`comment_like:${id}:`);
    if (likes.length) {
      await kv.mdel(likes.map((l: any) => `comment_like:${id}:${l?.userId}`).filter(Boolean));
    }
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/interactions/comments/:targetId/:id/like`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const targetId = safeTargetId(c.req.param("targetId"));
  const id = c.req.param("id");
  if (!targetId || !id) return c.json({ error: "invalid" }, 400);
  try {
    const existing: any = await kv.get(`comment:${targetId}:${id}`);
    if (!existing) return c.json({ error: "not found" }, 404);
    const likeKey = `comment_like:${id}:${r.user.id}`;
    const already = await kv.get(likeKey);
    let likes = Number(existing.likes ?? 0);
    if (already) {
      await kv.del(likeKey);
      likes = Math.max(0, likes - 1);
    } else {
      await kv.set(likeKey, { commentId: id, userId: r.user.id, at: Date.now() });
      likes = likes + 1;
    }
    const merged = { ...existing, likes };
    await kv.set(`comment:${targetId}:${id}`, merged);
    return c.json({ item: merged, liked: !already });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Emoji reactions — one per (user, target). Returns aggregate counts + the
// caller's own choice. Public read; write requires auth.
app.get(`${PREFIX}/interactions/reactions/:targetId`, async (c) => {
  const targetId = safeTargetId(c.req.param("targetId"));
  if (!targetId) return c.json({ error: "invalid targetId" }, 400);
  try {
    const items = await kv.getByPrefix(`reaction:${targetId}:`);
    const counts: Record<string, number> = {};
    for (const it of items as any[]) {
      const t = it?.type;
      if (typeof t === "string") counts[t] = (counts[t] ?? 0) + 1;
    }
    // Caller's own reaction if authenticated.
    let mine: string | null = null;
    const caller = await getUser(c.req.raw);
    if (caller) {
      const own: any = await kv.get(`reaction:${targetId}:${caller.id}`);
      mine = own?.type ?? null;
    }
    return c.json({ counts, mine, total: items.length });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.put(`${PREFIX}/interactions/reactions/:targetId`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const targetId = safeTargetId(c.req.param("targetId"));
  if (!targetId) return c.json({ error: "invalid targetId" }, 400);
  const pb = await parseBody(c, z.object({ type: ReactionTypeSchema.nullable() }));
  if (!pb.ok) return pb.res;
  try {
    const { type } = pb.data;
    const key = `reaction:${targetId}:${r.user.id}`;
    if (type === null) {
      await kv.del(key);
      return c.json({ ok: true, mine: null });
    }
    await kv.set(key, { targetId, userId: r.user.id, type, at: Date.now() });
    return c.json({ ok: true, mine: type });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== POLLS ==============
// Aggregated per-option counts + per-user current vote.
// Keys:
//   poll_vote:<pollId>:<userId>  → { optionId, at }
//   Counts are derived by scanning the prefix. Vote is idempotent: a user can
//   change their vote, which moves their tally from old option to new.

app.get(`${PREFIX}/interactions/polls/:pollId`, async (c) => {
  const pollId = safeTargetId(c.req.param("pollId"));
  if (!pollId) return c.json({ error: "invalid pollId" }, 400);
  try {
    const items = await kv.getByPrefix(`poll_vote:${pollId}:`);
    const counts: Record<string, number> = {};
    for (const it of items as any[]) {
      const o = it?.optionId;
      if (typeof o === "string") counts[o] = (counts[o] ?? 0) + 1;
    }
    let mine: string | null = null;
    const caller = await getUser(c.req.raw);
    if (caller) {
      const own: any = await kv.get(`poll_vote:${pollId}:${caller.id}`);
      mine = own?.optionId ?? null;
    }
    return c.json({ counts, mine, total: items.length });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/interactions/polls/:pollId/vote`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const pollId = safeTargetId(c.req.param("pollId"));
  if (!pollId) return c.json({ error: "invalid pollId" }, 400);
  const pb = await parseBody(c, z.object({ optionId: z.string().min(1).max(80) }));
  if (!pb.ok) return pb.res;
  const optionId = pb.data.optionId.trim();
  if (!/^[a-zA-Z0-9_:-]+$/.test(optionId)) return c.json({ error: "invalid optionId" }, 400);
  const rl = await rateLimit("poll_vote", r.user.id, 60, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(c, rl);
  try {
    await kv.set(`poll_vote:${pollId}:${r.user.id}`, { pollId, optionId, at: Date.now() });
    return c.json({ ok: true, mine: optionId });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== VIEW / PLAY COUNTERS ==============
// Single counter per targetId, incremented at most once per user (when authed)
// or per IP (when anonymous) per 24h window to prevent trivial inflation.
// Keys:
//   view_count:<targetId>          → { total: number }
//   view_seen:<targetId>:<userOrIp> → { at }

app.get(`${PREFIX}/interactions/views/:targetId`, async (c) => {
  const targetId = safeTargetId(c.req.param("targetId"));
  if (!targetId) return c.json({ error: "invalid targetId" }, 400);
  try {
    const rec: any = await kv.get(`view_count:${targetId}`);
    return c.json({ total: rec?.total ?? 0 });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/interactions/views`, async (c) => {
  const pb = await parseBody(c, z.object({ ids: z.array(z.string().min(1).max(200)).min(1).max(50) }));
  if (!pb.ok) return pb.res;
  try {
    const out: Record<string, number> = {};
    for (const raw of pb.data.ids) {
      const id = safeTargetId(raw);
      if (!id) continue;
      const rec: any = await kv.get(`view_count:${id}`);
      out[id] = rec?.total ?? 0;
    }
    return c.json({ counts: out });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.post(`${PREFIX}/interactions/views/:targetId`, async (c) => {
  const targetId = safeTargetId(c.req.param("targetId"));
  if (!targetId) return c.json({ error: "invalid targetId" }, 400);
  try {
    const caller = await getUser(c.req.raw);
    const dedupeId = caller?.id ?? `ip:${clientIp(c.req.raw)}`;
    const dedupeKey = `view_seen:${targetId}:${dedupeId}`;
    const seen: any = await kv.get(dedupeKey);
    const now = Date.now();
    if (seen?.at && now - seen.at < 24 * 60 * 60 * 1000) {
      const cur: any = await kv.get(`view_count:${targetId}`);
      return c.json({ total: cur?.total ?? 0, counted: false });
    }
    const rl = await rateLimit("view_inc", dedupeId, 300, 60 * 60 * 1000);
    if (!rl.ok) return rateLimitResponse(c, rl);
    const cur: any = await kv.get(`view_count:${targetId}`);
    const total = (cur?.total ?? 0) + 1;
    await kv.set(`view_count:${targetId}`, { total, updatedAt: now });
    await kv.set(dedupeKey, { at: now });
    return c.json({ total, counted: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== PRIVATE USER DATA ==============
// Per-user buckets for favorites, history, mood log, recent searches, etc.
// Key shape: `user_data:<userId>:<kind>:<id>`. The kind is whitelisted so a
// client cannot scribble arbitrary KV namespaces under its own prefix.
const USER_DATA_KINDS = new Set([
  "favorite",       // saved articles/episodes/videos/opportunities
  "history",        // recently-viewed items
  "mood",           // wellbeing mood-log entries
  "search_recent",  // recent search queries
  "reaction",       // simple boolean reaction map per content id
  "emoji_reaction", // single emoji reaction per content id
]);

// Hard caps to keep the KV row count sane. History/search self-trim by
// recency on the client; the server cap is the absolute ceiling.
const USER_DATA_CAPS: Record<string, number> = {
  favorite: 500, history: 100, mood: 1000, search_recent: 50,
  reaction: 5000, emoji_reaction: 5000,
};

function userDataKey(userId: string, kind: string, id: string) {
  return `user_data:${userId}:${kind}:${id}`;
}
function userDataPrefix(userId: string, kind: string) {
  return `user_data:${userId}:${kind}:`;
}

app.get(`${PREFIX}/user/data/:kind`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const kind = c.req.param("kind");
  if (!USER_DATA_KINDS.has(kind)) return c.json({ error: "unknown kind" }, 404);
  try {
    const items = await kv.getByPrefix(userDataPrefix(r.user.id, kind));
    items.sort((a: any, b: any) =>
      (b?.savedAt ?? b?.updatedAt ?? b?.createdAt ?? 0) -
      (a?.savedAt ?? a?.updatedAt ?? a?.createdAt ?? 0));
    return c.json(paginate(items, readPage(c)));
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.put(`${PREFIX}/user/data/:kind/:id`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const kind = c.req.param("kind");
  const id = c.req.param("id");
  if (!USER_DATA_KINDS.has(kind)) return c.json({ error: "unknown kind" }, 404);
  if (!id || id.length > 200) return c.json({ error: "invalid id" }, 400);
  const pb = await parseBody(c, z.object({}).passthrough());
  if (!pb.ok) return pb.res;
  try {
    const body = pb.data;
    // Enforce cap before writing a new entry.
    const cap = USER_DATA_CAPS[kind] ?? 1000;
    const existing = await kv.get(userDataKey(r.user.id, kind, id));
    if (!existing) {
      const all = await kv.getByPrefix(userDataPrefix(r.user.id, kind));
      if (all.length >= cap) {
        // Evict oldest by savedAt/createdAt to make room.
        const sorted = all
          .map((x: any) => ({ k: `${kind}:${x?.id}`, t: x?.savedAt ?? x?.createdAt ?? 0, id: x?.id }))
          .filter((x) => x.id)
          .sort((a, b) => a.t - b.t);
        const evict = sorted.slice(0, all.length - cap + 1);
        if (evict.length) {
          await kv.mdel(evict.map((e) => userDataKey(r.user.id, kind, e.id!)));
        }
      }
    }
    const merged = { ...body, id, _kind: kind, updatedAt: Date.now() };
    await kv.set(userDataKey(r.user.id, kind, id), merged);
    return c.json({ item: merged });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${PREFIX}/user/data/:kind/:id`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const kind = c.req.param("kind");
  const id = c.req.param("id");
  if (!USER_DATA_KINDS.has(kind)) return c.json({ error: "unknown kind" }, 404);
  try {
    await kv.del(userDataKey(r.user.id, kind, id));
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.delete(`${PREFIX}/user/data/:kind`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const kind = c.req.param("kind");
  if (!USER_DATA_KINDS.has(kind)) return c.json({ error: "unknown kind" }, 404);
  try {
    const all = await kv.getByPrefix(userDataPrefix(r.user.id, kind));
    const keys = all.map((x: any) => x?.id).filter(Boolean).map((id: string) => userDataKey(r.user.id, kind, id));
    if (keys.length) await kv.mdel(keys);
    return c.json({ ok: true, cleared: keys.length });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Bulk upsert — used by the client to migrate the local cache into the
// account on first authenticated load.
app.post(`${PREFIX}/user/data/:kind/bulk`, async (c) => {
  const r = await requireUser(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  const kind = c.req.param("kind");
  if (!USER_DATA_KINDS.has(kind)) return c.json({ error: "unknown kind" }, 404);
  const pb = await parseBody(c, z.object({
    items: z.array(z.object({ id: z.union([z.string(), z.number()]) }).passthrough()).max(1000),
  }));
  if (!pb.ok) return pb.res;
  try {
    const { items } = pb.data;
    const cap = USER_DATA_CAPS[kind] ?? 1000;
    const trimmed = items.slice(0, cap);
    const keys: string[] = [];
    const values: unknown[] = [];
    for (const it of trimmed) {
      if (!it || typeof it !== "object" || !it.id) continue;
      keys.push(userDataKey(r.user.id, kind, String(it.id)));
      values.push({ ...it, _kind: kind, updatedAt: Date.now() });
    }
    if (keys.length) await kv.mset(keys, values);
    return c.json({ ok: true, count: keys.length });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== ADMIN STATS ==============
app.get(`${PREFIX}/admin/stats`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  try {
    const subs = await kv.getByPrefix("subscription:");
    const allTx = await kv.getByPrefix("transaction:");
    const success = allTx.filter((t: any) => t?.status === "success");
    const revenue = success.reduce((s: number, t: any) => s + (t?.amountXOF ?? 0), 0);
    const activeSubs = subs.filter((s: any) => s && Date.parse(s.expiresAt) > Date.now());
    return c.json({
      subscriptions: subs.length,
      activeSubscriptions: activeSubs.length,
      transactions: allTx.length,
      successful: success.length,
      revenueXOF: revenue,
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== ADMIN: list users ==============
app.get(`${PREFIX}/admin/users`, async (c) => {
  const r = await requireAdmin(c.req.raw);
  if (!r.ok) return c.json({ error: r.msg }, r.status);
  try {
    const profiles = await kv.getByPrefix("user_profile:");
    profiles.sort((a: any, b: any) => {
      const ta = Date.parse(a?.createdAt ?? "") || 0;
      const tb = Date.parse(b?.createdAt ?? "") || 0;
      return tb - ta;
    });
    const page = readPage(c);
    const slice = paginate(profiles, page);
    // Keep the legacy `users` field while also exposing the new shape so
    // existing admin clients don't break mid-deploy.
    return c.json({ users: slice.items, items: slice.items, total: slice.total, nextOffset: slice.nextOffset });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ============== CRON: SUBSCRIPTION RENEWAL / EXPIRATION ==============
// Invoked by Supabase pg_cron (or any external scheduler) via:
//   POST /cron/subscriptions/tick   header: x-cron-secret: <CRON_SECRET>
// For each subscription:
//   - if expiresAt is past and autoRenew is true → attempt silent renewal
//     using the last successful tx's operator/phone (best-effort; CinetPay
//     mobile-money requires user confirmation, so this typically just
//     creates a pending tx and emits a notification).
//   - if expiresAt is past and autoRenew is false → mark status=cancelled.
const CRON_SECRET = Deno.env.get("CRON_SECRET");

app.post(`${PREFIX}/cron/subscriptions/tick`, async (c) => {
  const provided = c.req.header("x-cron-secret");
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return c.json({ error: "forbidden" }, 403);
  }
  const now = Date.now();
  const subs = await kv.getByPrefix("subscription:") as any[];
  let expired = 0, renewedAttempts = 0, cancelled = 0;
  const inboxKeys: string[] = [];
  const inboxValues: unknown[] = [];

  for (const sub of subs) {
    if (!sub?.userId || !sub?.expiresAt) continue;
    const exp = Date.parse(sub.expiresAt);
    if (!exp || exp > now) continue; // still active
    if (sub.status === "cancelled" || sub.status === "expired") continue;

    if (!sub.autoRenew) {
      const next = { ...sub, status: "expired", updatedAt: new Date().toISOString() };
      await kv.set(`subscription:${sub.userId}`, next);
      cancelled++;
      const id = `n-exp-${now}-${sub.userId.slice(0, 6)}`;
      inboxKeys.push(`notif_inbox:${sub.userId}:${id}`);
      inboxValues.push({
        id, title: "Abonnement expiré",
        body: "Votre abonnement Premium a expiré. Renouvelez pour continuer à profiter de tous les contenus.",
        url: "/premium", iconKey: "alert", color: "#FF3B30",
        sentAt: now, read: false,
      });
      continue;
    }

    // autoRenew = true → try to re-init payment using last successful tx
    try {
      const txs = await kv.getByPrefix(`transaction:${sub.userId}:`) as any[];
      const lastSuccess = txs
        .filter((t) => t?.status === "success" && t?.operator && t?.phone)
        .sort((a, b) => Date.parse(b.paidAt ?? b.createdAt ?? "") - Date.parse(a.paidAt ?? a.createdAt ?? ""))[0];
      const plan = planOf(sub.planId);
      if (!lastSuccess || !plan || !CINETPAY_API_KEY || !CINETPAY_SITE_ID) {
        // Cannot retry — mark grace-period expired and notify.
        const next = { ...sub, status: "grace", updatedAt: new Date().toISOString() };
        await kv.set(`subscription:${sub.userId}`, next);
        expired++;
        const id = `n-grace-${now}-${sub.userId.slice(0, 6)}`;
        inboxKeys.push(`notif_inbox:${sub.userId}:${id}`);
        inboxValues.push({
          id, title: "Renouvellement requis",
          body: "Nous n'avons pas pu renouveler votre abonnement automatiquement. Merci de relancer le paiement.",
          url: "/premium", iconKey: "alert", color: "#FF9500",
          sentAt: now, read: false,
        });
        continue;
      }

      const transactionId = `IPP-RNW-${now}-${crypto.randomUUID().slice(0, 6)}`;
      const pending = {
        id: transactionId, userId: sub.userId, planId: sub.planId,
        operator: lastSuccess.operator, phone: lastSuccess.phone,
        amountXOF: plan.amountXOF, status: "pending",
        createdAt: new Date().toISOString(), provider: "cinetpay", renewalOf: sub.lastTxId,
      };
      await kv.set(`transaction:${sub.userId}:${transactionId}`, pending);
      await kv.set(`transaction_lookup:${transactionId}`, { userId: sub.userId });

      const payload = {
        apikey: CINETPAY_API_KEY, site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId, amount: plan.amountXOF, currency: "XOF",
        description: `IPPOO ${plan.label} (renouvellement)`,
        notify_url: CINETPAY_NOTIFY_URL,
        channels: "MOBILE_MONEY", lang: "FR",
        customer_id: sub.userId, customer_phone_number: lastSuccess.phone,
      };
      const resp = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      const codeOk = data?.code === "201" || data?.code === 201;
      renewedAttempts++;
      const id = `n-rnw-${now}-${sub.userId.slice(0, 6)}`;
      inboxKeys.push(`notif_inbox:${sub.userId}:${id}`);
      inboxValues.push({
        id,
        title: codeOk ? "Renouvellement en cours" : "Renouvellement à confirmer",
        body: codeOk
          ? "Confirmez le paiement Mobile Money sur votre téléphone pour prolonger votre abonnement."
          : "Le renouvellement automatique a échoué. Merci de relancer le paiement.",
        url: codeOk && data?.data?.payment_url ? data.data.payment_url : "/premium",
        iconKey: codeOk ? "event" : "alert",
        color: codeOk ? "#007AFF" : "#FF9500",
        sentAt: now, read: false,
      });
      if (!codeOk) {
        await kv.set(`transaction:${sub.userId}:${transactionId}`, { ...pending, status: "failed", error: data?.message ?? "init failed" });
        const next = { ...sub, status: "grace", updatedAt: new Date().toISOString() };
        await kv.set(`subscription:${sub.userId}`, next);
      }
    } catch (e) {
      log({ event: "cron.renewal_error", level: "error", userId: sub.userId, error: String(e) });
    }
  }

  if (inboxKeys.length) {
    try { await kv.mset(inboxKeys, inboxValues); } catch (e) { log({ event: "cron.inbox_write_error", level: "warn", error: String(e) }); }
  }

  return c.json({ ok: true, scanned: subs.length, expired, renewedAttempts, cancelled });
});

Deno.serve(app.fetch);

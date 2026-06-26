/* IPPOO SOCIAL-FACT — Couche d'accès relationnelle
 * =========================================================================
 * Implémente la MÊME interface que kv_store.tsx (get/set/del/mget/mset/mdel/
 * getByPrefix) mais persiste chaque type de donnée dans SA table dédiée
 * (voir migrations 0002/0003/0004), au lieu d'une table key-value unique.
 *
 * Principe de non-perte : l'objet d'origine est stocké intégralement dans la
 * colonne `data jsonb` et renvoyé tel quel en lecture → comportement des 51
 * routes inchangé. Les colonnes typées sont alimentées en parallèle pour
 * permettre RLS par colonne, Realtime et requêtes SQL.
 *
 * Le fichier protégé kv_store.tsx n'est PAS modifié ; index.tsx importe ce
 * module à la place.
 * =========================================================================
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ---------- Routage clé → table ----------
// Une clé a la forme `<segment0>:<reste...>`. `segment0` détermine la table.
type Route = {
  table: string;
  // Construit la ligne à upsert à partir de (parts, value).
  toRow: (parts: string[], value: any) => Record<string, any>;
  // Conflit d'upsert (PK).
  onConflict: string;
  // Filtre d'égalité pour get/del à partir des parts de la clé.
  pk: (parts: string[]) => Record<string, any>;
  // Filtres pour getByPrefix à partir des parts du préfixe (sans le dernier
  // segment vide après le `:` final).
  prefixFilter?: (parts: string[]) => Record<string, any>;
  // Filtre SQL `like` optionnel (utile quand plusieurs ressources cohabitent
  // dans la même table — typiquement app_config).
  prefixLike?: (parts: string[]) => { column: string; pattern: string } | null;
  // Reconstruit la valeur renvoyée en lecture (par défaut: row.data).
  fromRow?: (row: any) => any;
};

const num = (v: any) => (v === undefined || v === null || v === "" ? null : Number(v));
const str = (v: any) => (v === undefined || v === null ? null : String(v));
const ts = (v: any) => {
  if (!v) return null;
  const n = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
};

// Tables de contenu éditorial : `<resource>:<id>`
function contentRoute(table: string, extra?: (v: any) => Record<string, any>): Route {
  return {
    table,
    onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"),
      title: str(v?.title) ?? "(sans titre)",
      image: str(v?.image),
      section: str(v?.section),
      data: v ?? {},
      ...(extra ? extra(v) : {}),
    }),
  };
}

const ROUTES: Record<string, Route> = {
  // ---- Contenu ----
  article: contentRoute("articles", (v) => ({
    category: str(v?.category), location: str(v?.location), excerpt: str(v?.excerpt),
    body: str(v?.body), color: str(v?.color), read_time: str(v?.readTime),
    premium: !!v?.premium, published: v?.published !== false, published_at: ts(v?.publishedAt ?? v?.date),
  })),
  episode: contentRoute("episodes", (v) => ({
    show: str(v?.show), duration: str(v?.duration), audio_url: str(v?.audioUrl ?? v?.audio),
    color: str(v?.color), premium: !!v?.premium, published: v?.published !== false,
  })),
  video: contentRoute("videos", (v) => ({
    type: str(v?.type), duration: str(v?.duration), video_url: str(v?.videoUrl ?? v?.video),
    premium: !!v?.premium, published: v?.published !== false,
  })),
  short: contentRoute("shorts", (v) => ({
    author: str(v?.author), duration: str(v?.duration), video_url: str(v?.videoUrl ?? v?.video),
    published: v?.published !== false,
  })),
  opportunity: contentRoute("opportunities", (v) => ({
    tag: str(v?.tag), deadline: str(v?.deadline), color: str(v?.color), published: v?.published !== false,
  })),
  dossier: contentRoute("dossiers", (v) => ({ published: v?.published !== false })),
  page: contentRoute("pages", (v) => ({ slug: str(v?.slug), body: str(v?.body), published: v?.published !== false })),
  program: {
    table: "programs", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"), title: str(v?.title) ?? "(programme)",
      starts_at: str(v?.startsAt ?? v?.start), ends_at: str(v?.endsAt ?? v?.end),
      channel: str(v?.channel), data: v ?? {},
    }),
  },
  price: {
    table: "prices", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"), product: str(v?.product) ?? "(produit)", unit: str(v?.unit),
      category: str(v?.category), price: num(v?.price), prev: num(v?.prev),
      history: v?.history ?? [], ref_min: num(v?.refMin), ref_max: num(v?.refMax),
      markets: v?.markets ?? [], source: str(v?.source), updated_label: str(v?.updated), data: v ?? {},
    }),
  },
  push: {
    table: "push_campaigns", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"), title: str(v?.title) ?? "(push)", body: str(v?.body),
      url: str(v?.url), sent_at: ts(v?.sentAt), data: v ?? {},
    }),
  },
  theme: {
    // theme:<id> → app_config sous la clé complète
    table: "app_config", onConflict: "key",
    pk: (p) => ({ key: p.join(":") }),
    toRow: (p, v) => ({ key: p.join(":"), value: v ?? {} }),
    fromRow: (r) => r.value,
  },
  // ---- Carrousel publicitaire : stocké dans app_config sous `ad:<id>` ----
  // L'objet complet est conservé (data jsonb). Liste/get/delete via les routes
  // génériques /content/ad/* qui passent par getByPrefix/get/del.
  ad: {
    table: "app_config", onConflict: "key",
    pk: (p) => ({ key: p.join(":") }),
    prefixLike: () => ({ column: "key", pattern: "ad:%" }),
    toRow: (p, v) => ({ key: p.join(":"), value: v ?? {} }),
    fromRow: (r) => r.value,
  },

  // ---- Bien-être ----
  wb_post: {
    table: "wb_posts", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"), author_id: v?.authorId ?? null, author_name: str(v?.author ?? v?.authorName),
      body: str(v?.body ?? v?.text), mood: str(v?.mood), data: v ?? {},
    }),
  },
  wb_post_reply: {
    table: "wb_post_replies", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"), post_id: str(v?.postId), author_id: v?.authorId ?? null,
      author_name: str(v?.author ?? v?.authorName), body: str(v?.body ?? v?.text), data: v ?? {},
    }),
  },
  wb_music: {
    table: "wb_music", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({ id: p.slice(1).join(":"), title: str(v?.title) ?? "(playlist)", data: v ?? {} }),
  },
  wb_track: {
    table: "wb_tracks", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":"), music_id: str(v?.musicId), title: str(v?.title) ?? "(piste)",
      audio_url: str(v?.audioUrl ?? v?.audio), duration: str(v?.duration), data: v ?? {},
    }),
  },

  // ---- Interactions ----
  comment: {
    // comment:<targetId>:<commentId>
    table: "comments", onConflict: "id",
    pk: (p) => ({ id: p[2] }),
    prefixFilter: (p) => ({ target_id: p[1] }),
    toRow: (p, v) => ({
      id: p[2] ?? v?.id, target_id: p[1] ?? v?.targetId, author_id: v?.authorId ?? null,
      author_name: str(v?.author ?? v?.authorName), body: str(v?.text ?? v?.body) ?? "",
      status: str(v?.status) ?? "approved", likes: num(v?.likes) ?? 0, data: v ?? {},
    }),
  },
  comment_like: {
    // comment_like:<commentId>:<userId>
    table: "comment_likes", onConflict: "comment_id,user_id",
    pk: (p) => ({ comment_id: p[1], user_id: p[2] }),
    prefixFilter: (p) => ({ comment_id: p[1] }),
    toRow: (p, v) => ({ comment_id: p[1], user_id: p[2], ...(v?.createdAt ? { created_at: ts(v.createdAt) } : {}) }),
    fromRow: (r) => r,
  },
  reaction: {
    // reaction:<targetId>:<userId>
    table: "reactions", onConflict: "target_id,user_id",
    pk: (p) => ({ target_id: p[1], user_id: p[2] }),
    prefixFilter: (p) => ({ target_id: p[1] }),
    toRow: (p, v) => ({ target_id: p[1], user_id: p[2], type: str(v?.type) ?? "like" }),
    fromRow: (r) => ({ targetId: r.target_id, userId: r.user_id, type: r.type, at: Date.parse(r.created_at) }),
  },
  poll_vote: {
    // poll_vote:<pollId>:<userId>
    table: "poll_votes", onConflict: "poll_id,user_id",
    pk: (p) => ({ poll_id: p[1], user_id: p[2] }),
    prefixFilter: (p) => ({ poll_id: p[1] }),
    toRow: (p, v) => ({ poll_id: p[1], user_id: p[2], option_id: str(v?.optionId) }),
    fromRow: (r) => ({ pollId: r.poll_id, userId: r.user_id, optionId: r.option_id, at: Date.parse(r.created_at) }),
  },
  view_count: {
    table: "view_counts", onConflict: "target_id",
    pk: (p) => ({ target_id: p.slice(1).join(":") }),
    toRow: (p, v) => ({ target_id: p.slice(1).join(":"), total: num(v?.total) ?? 0, updated_at: ts(v?.updatedAt) ?? new Date().toISOString() }),
    fromRow: (r) => ({ total: Number(r.total), updatedAt: Date.parse(r.updated_at) }),
  },
  view_seen: {
    // view_seen:<targetId>:<viewer>
    table: "view_seen", onConflict: "target_id,viewer",
    pk: (p) => ({ target_id: p[1], viewer: p.slice(2).join(":") }),
    toRow: (p, v) => ({ target_id: p[1], viewer: p.slice(2).join(":"), seen_at: ts(v?.at) ?? new Date().toISOString() }),
    fromRow: (r) => ({ at: Date.parse(r.seen_at) }),
  },

  // ---- Utilisateur ----
  user_data: {
    // user_data:<userId>:<kind>:<id>
    table: "user_items", onConflict: "user_id,kind,item_id",
    pk: (p) => ({ user_id: p[1], kind: p[2], item_id: p.slice(3).join(":") }),
    prefixFilter: (p) => {
      const f: Record<string, any> = { user_id: p[1] };
      if (p[2]) f.kind = p[2];
      return f;
    },
    toRow: (p, v) => ({ user_id: p[1], kind: p[2], item_id: p.slice(3).join(":"), value: v ?? {} }),
    fromRow: (r) => r.value,
  },
  user_profile: {
    table: "profiles", onConflict: "id",
    pk: (p) => ({ id: p[1] }),
    toRow: (p, v) => ({
      id: p[1] ?? v?.id, email: str(v?.email), first_name: str(v?.firstName),
      phone: str(v?.phone), zone: str(v?.zone), language: str(v?.language),
      role: str(v?.role) ?? "user", data: v ?? {},
    }),
  },
  notif_inbox: {
    // notif_inbox:<userId>:<id>
    table: "notifications", onConflict: "id",
    pk: (p) => ({ id: p.slice(2).join(":") }),
    prefixFilter: (p) => ({ user_id: p[1] }),
    toRow: (p, v) => ({
      id: p.slice(2).join(":") ?? v?.id, user_id: p[1] ?? v?.userId, title: str(v?.title),
      body: str(v?.body), url: str(v?.url), read: !!v?.read, data: v ?? {},
    }),
  },
  push_sub: {
    // push_sub:<userId>:<id>
    table: "push_subscriptions", onConflict: "id",
    pk: (p) => ({ id: p.slice(2).join(":") }),
    prefixFilter: (p) => ({ user_id: p[1] }),
    toRow: (p, v) => ({
      id: p.slice(2).join(":") ?? v?.id, user_id: p[1] ?? v?.userId,
      endpoint: str(v?.endpoint ?? v?.subscription?.endpoint) ?? "", keys: v?.keys ?? v?.subscription?.keys ?? {}, data: v ?? {},
    }),
  },

  // ---- Paiements ----
  subscription: {
    table: "subscriptions", onConflict: "user_id",
    pk: (p) => ({ user_id: p[1] }),
    toRow: (p, v) => ({
      user_id: p[1] ?? v?.userId, plan: str(v?.plan), status: str(v?.status) ?? "inactive",
      current_period_end: ts(v?.currentPeriodEnd ?? v?.periodEnd), data: v ?? {},
    }),
  },
  transaction: {
    table: "transactions", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({
      id: p.slice(1).join(":") ?? v?.id, user_id: v?.userId ?? null, ref: str(v?.ref ?? v?.transactionId),
      plan: str(v?.plan), operator: str(v?.operator), phone: str(v?.phone), amount: num(v?.amount),
      status: str(v?.status) ?? "pending", data: v ?? {},
    }),
  },
  transaction_lookup: {
    // transaction_lookup:<ref> → app_config (index simple)
    table: "app_config", onConflict: "key",
    pk: (p) => ({ key: p.join(":") }),
    toRow: (p, v) => ({ key: p.join(":"), value: v ?? null }),
    fromRow: (r) => r.value,
  },

  // ---- Infra ----
  config: {
    table: "app_config", onConflict: "key",
    pk: (p) => ({ key: p.slice(1).join(":") }),
    toRow: (p, v) => ({ key: p.slice(1).join(":"), value: v ?? null }),
    fromRow: (r) => r.value,
  },
  rate: {
    // rate:<scope>:<id>:<bucket> → rate_limits (clé = reste)
    table: "rate_limits", onConflict: "bucket",
    pk: (p) => ({ bucket: p.slice(1).join(":") }),
    toRow: (p, v) => ({ bucket: p.slice(1).join(":"), count: num(v) ?? 0, expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }),
    fromRow: (r) => r.count,
  },
  ip: {
    table: "app_config", onConflict: "key",
    pk: (p) => ({ key: p.join(":") }),
    toRow: (p, v) => ({ key: p.join(":"), value: v ?? null }),
    fromRow: (r) => r.value,
  },
  seen_webhook: {
    table: "webhook_dedup", onConflict: "id",
    pk: (p) => ({ id: p.slice(1).join(":") }),
    toRow: (p, v) => ({ id: p.slice(1).join(":"), seen_at: ts(v?.at) ?? new Date().toISOString() }),
    fromRow: (r) => ({ at: Date.parse(r.seen_at) }),
  },
  log: {
    table: "app_logs", onConflict: "id",
    pk: () => ({ id: -1 }), // logs are append-only; get by exact key not used
    toRow: (_p, v) => ({ level: str(v?.level) ?? "info", scope: str(v?.scope), message: str(v?.message), data: v ?? {} }),
    fromRow: (r) => r.data,
  },
};

// Fallback générique : tout préfixe inconnu atterrit dans app_config sous la
// clé complète → AUCUNE donnée n'est jamais perdue.
function fallbackRoute(): Route {
  return {
    table: "app_config", onConflict: "key",
    pk: (p) => ({ key: p.join(":") }),
    toRow: (p, v) => ({ key: p.join(":"), value: v ?? null }),
    fromRow: (r) => r.value,
  };
}

function routeFor(seg0: string): Route {
  return ROUTES[seg0] ?? fallbackRoute();
}

function reconstruct(route: Route, row: any): any {
  if (!row) return undefined;
  if (route.fromRow) return route.fromRow(row);
  return row.data ?? row;
}

// ---------- Interface KV ----------
export const set = async (key: string, value: any): Promise<void> => {
  const parts = key.split(":");
  const route = routeFor(parts[0]);
  const row = route.toRow(parts, value);
  const { error } = await supabase.from(route.table).upsert(row, { onConflict: route.onConflict });
  if (error) throw new Error(`db.set(${key}) → ${route.table}: ${error.message}`);
};

export const get = async (key: string): Promise<any> => {
  const parts = key.split(":");
  const route = routeFor(parts[0]);
  let q = supabase.from(route.table).select("*");
  for (const [k, v] of Object.entries(route.pk(parts))) q = q.eq(k, v as any);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`db.get(${key}) → ${route.table}: ${error.message}`);
  return reconstruct(route, data);
};

export const del = async (key: string): Promise<void> => {
  const parts = key.split(":");
  const route = routeFor(parts[0]);
  let q = supabase.from(route.table).delete();
  for (const [k, v] of Object.entries(route.pk(parts))) q = q.eq(k, v as any);
  const { error } = await q;
  if (error) throw new Error(`db.del(${key}) → ${route.table}: ${error.message}`);
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  // prefix se termine généralement par ':' → on retire le segment vide final.
  const parts = prefix.split(":").filter((s, i, a) => !(i === a.length - 1 && s === ""));
  const route = routeFor(parts[0]);
  let q = supabase.from(route.table).select("*");
  if (route.prefixFilter) {
    for (const [k, v] of Object.entries(route.prefixFilter(parts))) q = q.eq(k, v as any);
  }
  if (route.prefixLike) {
    const lk = route.prefixLike(parts);
    if (lk) q = q.like(lk.column, lk.pattern);
  }
  // Sinon : table de contenu → on renvoie toutes les lignes de la table.
  const { data, error } = await q.limit(2000);
  if (error) throw new Error(`db.getByPrefix(${prefix}) → ${route.table}: ${error.message}`);
  return (data ?? []).map((row) => reconstruct(route, row));
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  await Promise.all(keys.map((k, i) => set(k, values[i])));
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return Promise.all(keys.map((k) => get(k)));
};

export const mdel = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map((k) => del(k)));
};

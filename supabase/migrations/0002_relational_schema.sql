-- IPPOO SOCIAL-FACT — Schéma relationnel complet
-- =========================================================================
-- Remplace le modèle « tout-en-une-table » KV par des tables dédiées.
-- À exécuter une fois dans le SQL Editor, APRÈS 0000_schema.sql.
-- (0000 reste utile : la table kv_store n'est plus utilisée par le code une
--  fois la migration terminée, mais sert de source pour le backfill éventuel.)
--
-- Convention :
--   • Chaque table a des colonnes typées pour les champs requêtés/filtrés.
--   • Une colonne `data jsonb` conserve tout champ additionnel → aucune perte.
--   • `created_at` / `updated_at` partout, `updated_at` maintenu par trigger.
--   • Toutes les écritures applicatives passent par l'Edge Function
--     (service_role) ; le RLS (fichier 0003) protège l'accès direct.
-- =========================================================================

-- ---------- Helper : trigger updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Petit helper pour attacher le trigger sans répéter le bloc.
do $$
declare t text;
begin
  -- (no-op ici ; les triggers sont créés explicitement plus bas)
  null;
end $$;

-- =========================================================================
-- 1) CONTENU ÉDITORIAL
-- =========================================================================

create table if not exists public.articles (
  id          text primary key,
  title       text not null,
  category    text,
  location    text,
  image       text,
  excerpt     text,
  body        text,
  section     text,
  color       text,
  read_time   text,
  premium     boolean not null default false,
  published   boolean not null default true,
  published_at timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.episodes (
  id          text primary key,
  title       text not null,
  show        text,
  duration    text,
  audio_url   text,
  image       text,
  section     text,
  color       text,
  premium     boolean not null default false,
  published   boolean not null default true,
  published_at timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.videos (
  id          text primary key,
  title       text not null,
  type        text,
  duration    text,
  video_url   text,
  image       text,
  section     text,
  premium     boolean not null default false,
  published   boolean not null default true,
  published_at timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.shorts (
  id          text primary key,
  title       text not null,
  author      text,
  duration    text,
  video_url   text,
  image       text,
  section     text,
  published   boolean not null default true,
  published_at timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.opportunities (
  id          text primary key,
  title       text not null,
  tag         text,
  deadline    text,
  image       text,
  color       text,
  section     text,
  published   boolean not null default true,
  published_at timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.dossiers (
  id          text primary key,
  title       text not null,
  image       text,
  published   boolean not null default true,
  published_at timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.pages (
  id          text primary key,
  title       text not null,
  slug        text unique,
  body        text,
  published   boolean not null default true,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.programs (
  id          text primary key,
  title       text not null,
  starts_at   text,
  ends_at     text,
  channel     text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.prices (
  id          text primary key,
  product     text not null,
  unit        text,
  category    text,
  price       numeric,
  prev        numeric,
  history     jsonb not null default '[]'::jsonb,
  ref_min     numeric,
  ref_max     numeric,
  markets     jsonb not null default '[]'::jsonb,
  source      text,
  updated_label text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.push_campaigns (
  id          text primary key,
  title       text not null,
  body        text,
  url         text,
  sent_at     timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =========================================================================
-- 2) BIEN-ÊTRE
-- =========================================================================

create table if not exists public.wb_posts (
  id          text primary key,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  body        text,
  mood        text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.wb_post_replies (
  id          text primary key,
  post_id     text not null references public.wb_posts(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists wb_post_replies_post_idx on public.wb_post_replies(post_id);

create table if not exists public.wb_music (
  id          text primary key,
  title       text not null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.wb_tracks (
  id          text primary key,
  music_id    text references public.wb_music(id) on delete cascade,
  title       text not null,
  audio_url   text,
  duration    text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists wb_tracks_music_idx on public.wb_tracks(music_id);

-- =========================================================================
-- 3) INTERACTIONS  (Realtime activé en 0004)
-- =========================================================================

create table if not exists public.comments (
  id          text primary key,
  target_id   text not null,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  body        text not null,
  status      text not null default 'approved'  -- approved | pending | rejected
    check (status in ('approved','pending','rejected')),
  likes       integer not null default 0,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists comments_target_idx on public.comments(target_id, created_at desc);
create index if not exists comments_status_idx on public.comments(status);

create table if not exists public.comment_likes (
  comment_id  text not null references public.comments(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.reactions (
  target_id   text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,  -- like | love | clap | wow | sad | angry
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (target_id, user_id)
);
create index if not exists reactions_target_idx on public.reactions(target_id);

create table if not exists public.poll_votes (
  poll_id     text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  option_id   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (poll_id, user_id)
);
create index if not exists poll_votes_poll_idx on public.poll_votes(poll_id);

create table if not exists public.view_counts (
  target_id   text primary key,
  total       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

-- Déduplication d'incrément de vue (par user/IP, fenêtre 24h)
create table if not exists public.view_seen (
  target_id   text not null,
  viewer      text not null,   -- user_id ou "ip:x.x.x.x"
  seen_at     timestamptz not null default now(),
  primary key (target_id, viewer)
);
create index if not exists view_seen_seen_at_idx on public.view_seen(seen_at);

-- =========================================================================
-- 4) UTILISATEUR
-- =========================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  first_name  text,
  phone       text,
  zone        text,
  language    text,
  role        text not null default 'user' check (role in ('user','editor','admin')),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Données privées polymorphes : favoris, historique, humeurs, recherches…
create table if not exists public.user_items (
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in
    ('favorite','history','mood','search_recent','reaction','emoji_reaction')),
  item_id     text not null,
  value       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
create index if not exists user_items_user_kind_idx on public.user_items(user_id, kind, updated_at desc);

create table if not exists public.notifications (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  body        text,
  url         text,
  read        boolean not null default false,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id) where read = false;

create table if not exists public.push_subscriptions (
  id          text primary key,            -- hash de l'endpoint
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  keys        jsonb not null,              -- { p256dh, auth }
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- =========================================================================
-- 5) PAIEMENTS
-- =========================================================================

create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  plan        text,                        -- monthly | yearly
  status      text not null default 'inactive', -- active | inactive | cancelled | pending
  current_period_end timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete set null,
  ref         text unique,                 -- transaction_lookup
  plan        text,
  operator    text,
  phone       text,
  amount      numeric,
  status      text not null default 'pending', -- pending | success | failed
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id, created_at desc);
create index if not exists transactions_ref_idx on public.transactions(ref);

-- =========================================================================
-- 6) INFRA  (tout-relationnel, comme demandé)
-- =========================================================================

create table if not exists public.app_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.rate_limits (
  bucket      text primary key,            -- scope:id
  count       integer not null default 0,
  window_start timestamptz not null default now(),
  expires_at  timestamptz
);
create index if not exists rate_limits_expires_idx on public.rate_limits(expires_at);

create table if not exists public.webhook_dedup (
  id          text primary key,            -- seen_webhook
  seen_at     timestamptz not null default now()
);

create table if not exists public.app_logs (
  id          bigserial primary key,
  level       text not null default 'info',
  scope       text,
  message     text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists app_logs_created_idx on public.app_logs(created_at desc);

-- =========================================================================
-- 7) Triggers updated_at sur toutes les tables qui ont la colonne
-- =========================================================================
do $$
declare r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and c.table_name in (
        'articles','episodes','videos','shorts','opportunities','dossiers',
        'pages','programs','prices','push_campaigns',
        'wb_posts','wb_post_replies','wb_music','wb_tracks',
        'comments','reactions','poll_votes',
        'profiles','user_items','subscriptions','transactions')
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', r.table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', r.table_name);
  end loop;
end $$;

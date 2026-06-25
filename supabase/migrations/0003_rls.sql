-- IPPOO SOCIAL-FACT — RLS par table
-- =========================================================================
-- À exécuter après 0002_relational_schema.sql.
--
-- Principe :
--   • Toutes les ÉCRITURES applicatives passent par l'Edge Function avec la
--     clé service_role, qui CONTOURNE le RLS. On ne crée donc AUCUNE policy
--     d'écriture pour anon/authenticated.
--   • Les LECTURES directes (REST + abonnements Realtime via la clé anon)
--     sont autorisées de façon ciblée : contenu publié = public ; données
--     privées = propriétaire uniquement ; infra = service_role seul.
-- =========================================================================

-- ---------- 1) Contenu éditorial : lecture publique si published ----------
do $$
declare t text;
begin
  foreach t in array array[
    'articles','episodes','videos','shorts','opportunities','dossiers',
    'pages','programs','prices']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists read_published on public.%I', t);
    -- programs/prices n'ont pas de colonne `published` → lecture publique totale
    if t in ('programs','prices') then
      execute format($f$create policy read_published on public.%I
        for select to anon, authenticated using (true)$f$, t);
    else
      execute format($f$create policy read_published on public.%I
        for select to anon, authenticated using (published = true)$f$, t);
    end if;
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- push_campaigns : admin-only → aucune policy publique (service_role seul)
alter table public.push_campaigns enable row level security;
revoke all on public.push_campaigns from anon, authenticated;
grant all on public.push_campaigns to service_role;

-- ---------- 2) Bien-être : lecture publique, écriture via Edge Function ----------
do $$
declare t text;
begin
  foreach t in array array['wb_posts','wb_post_replies','wb_music','wb_tracks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists read_all on public.%I', t);
    execute format($f$create policy read_all on public.%I
      for select to anon, authenticated using (true)$f$, t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- ---------- 3) Interactions : lecture publique (counts + Realtime) ----------
-- comments : seuls les commentaires "approved" sont visibles publiquement.
alter table public.comments enable row level security;
drop policy if exists read_approved on public.comments;
create policy read_approved on public.comments
  for select to anon, authenticated using (status = 'approved');
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant all on public.comments to service_role;

-- comment_likes / reactions / poll_votes / view_counts : lecture publique
do $$
declare t text;
begin
  foreach t in array array['comment_likes','reactions','poll_votes','view_counts']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists read_all on public.%I', t);
    execute format($f$create policy read_all on public.%I
      for select to anon, authenticated using (true)$f$, t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- view_seen : interne (dédup) → service_role seul
alter table public.view_seen enable row level security;
revoke all on public.view_seen from anon, authenticated;
grant all on public.view_seen to service_role;

-- ---------- 4) Données utilisateur : propriétaire uniquement ----------
alter table public.profiles enable row level security;
drop policy if exists read_own on public.profiles;
create policy read_own on public.profiles
  for select to authenticated using (id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

do $$
declare t text;
begin
  foreach t in array array['user_items','notifications','push_subscriptions','subscriptions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists read_own on public.%I', t);
    execute format($f$create policy read_own on public.%I
      for select to authenticated using (user_id = auth.uid())$f$, t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- transactions : propriétaire en lecture seule (suivi de paiement)
alter table public.transactions enable row level security;
drop policy if exists read_own on public.transactions;
create policy read_own on public.transactions
  for select to authenticated using (user_id = auth.uid());
revoke all on public.transactions from anon, authenticated;
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;

-- ---------- 5) Infra : service_role exclusivement (aucune lecture cliente) ----------
do $$
declare t text;
begin
  foreach t in array array['app_config','rate_limits','webhook_dedup','app_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

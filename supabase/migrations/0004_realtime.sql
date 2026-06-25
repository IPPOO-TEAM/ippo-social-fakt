-- IPPOO SOCIAL-FACT — Realtime
-- =========================================================================
-- Active la diffusion temps réel sur les tables où l'UI doit réagir
-- instantanément. La publication `supabase_realtime` est lue par le serveur
-- Realtime ; les clients reçoivent les changements via la clé anon, filtrés
-- par les policies RLS définies en 0003.
--
-- À exécuter après 0003_rls.sql.
-- =========================================================================

-- REPLICA IDENTITY FULL : nécessaire pour recevoir l'ancienne ligne lors des
-- UPDATE/DELETE (sinon seuls les champs de la PK sont émis).
do $$
declare t text;
begin
  foreach t in array array[
    'comments','comment_likes','reactions','poll_votes','view_counts',
    'notifications','wb_posts','wb_post_replies']
  loop
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;

-- Ajout des tables à la publication Realtime (idempotent).
do $$
declare t text;
begin
  foreach t in array array[
    'comments','comment_likes','reactions','poll_votes','view_counts',
    'notifications','wb_posts','wb_post_replies']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- IPPOO SOCIAL-FACT — Security hardening
-- Run once in the Supabase SQL editor of the production project.
--
-- Strategy: all application access goes through the Edge Function
-- `make-server-506b7b3b` which uses the service_role key. The kv_store
-- and the media bucket must therefore be inaccessible to the anon and
-- authenticated roles directly.

-- ============================================================
-- 1) Lock the KV table to service_role only
-- ============================================================
alter table public.kv_store_506b7b3b enable row level security;

-- Wipe any permissive policies that may have been added during dev.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'kv_store_506b7b3b'
  loop
    execute format('drop policy if exists %I on public.kv_store_506b7b3b', p.policyname);
  end loop;
end $$;

-- No CREATE POLICY on purpose: with RLS enabled and no policy,
-- anon/authenticated cannot read or write. service_role bypasses RLS.

revoke all on public.kv_store_506b7b3b from anon, authenticated;
grant  all on public.kv_store_506b7b3b to   service_role;

-- ============================================================
-- 2) Storage bucket policies — make-506b7b3b-media (private)
-- ============================================================
-- Bucket is created by the Edge Function as `public:false`.
-- Files are stored under `<user_id>/<path>`. Direct REST access from
-- the client is denied; the Edge Function issues short-lived signed URLs.

alter table storage.objects enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname like 'ippoo_media_%'
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;

-- Authenticated users may only read their own folder (defense in depth;
-- the app always goes through signed URLs but this protects against
-- accidental direct REST reads).
create policy ippoo_media_owner_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'make-506b7b3b-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- No insert/update/delete policies for anon or authenticated:
-- uploads must be signed by the Edge Function.

-- ============================================================
-- 3) Auth hardening — prevent role escalation via user_metadata
-- ============================================================
-- The Edge Function already forces role='user' on signup, but a
-- compromised client could still try to PATCH user_metadata.role via
-- the GoTrue updateUser endpoint. We strip any client-set role on
-- every auth.users write. The Edge Function (service_role) bypasses
-- this trigger because it sets the role through raw_app_meta_data.

create or replace function public.ippoo_strip_role_from_user_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'role' then
    new.raw_user_meta_data := new.raw_user_meta_data - 'role';
  end if;
  return new;
end $$;

drop trigger if exists ippoo_strip_role on auth.users;
create trigger ippoo_strip_role
before insert or update of raw_user_meta_data on auth.users
for each row execute function public.ippoo_strip_role_from_user_metadata();

-- NOTE: with this trigger active, the Edge Function must read the role
-- from raw_app_meta_data (admin-only namespace), not user_metadata.
-- See the matching change in supabase/functions/server/index.tsx.

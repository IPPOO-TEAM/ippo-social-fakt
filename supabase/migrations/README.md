# Supabase migrations

## 0001_security_hardening.sql

Verrouillage RLS pour la mise en production. À exécuter **une fois** dans le
SQL editor du projet Supabase prod (Dashboard → SQL → New query → coller →
Run).

Ce que la migration applique :

1. **`kv_store_506b7b3b` en RLS sans policy** — `anon` et `authenticated`
   n'ont plus aucun accès direct. Seul le `service_role` (utilisé par
   l'Edge Function `make-server-506b7b3b`) peut lire/écrire.
2. **Bucket `make-506b7b3b-media`** — `storage.objects` en RLS. Lecture
   directe limitée au dossier `<user_id>/...` du caller. Toute écriture
   passe obligatoirement par les URL signées émises par l'Edge Function.
3. **Trigger `ippoo_strip_role`** — supprime tout champ `role` que le
   client tenterait d'écrire dans `auth.users.raw_user_meta_data`. Le
   rôle effectif est stocké dans `app_metadata` (admin-only namespace),
   modifiable uniquement via `PUT /admin/users/:id/role`.

### Vérifications post-déploiement

```sql
-- 1. RLS active sans policy permissive
select relrowsecurity from pg_class where relname = 'kv_store_506b7b3b';
select policyname from pg_policies where tablename = 'kv_store_506b7b3b';

-- 2. Tentative anon (doit échouer)
-- depuis un client anon: select count(*) from kv_store_506b7b3b;
--   -> "permission denied" attendu

-- 3. Trigger actif
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass
  and tgname = 'ippoo_strip_role';
```

### Rollback

Le verrouillage est non destructif (aucune donnée modifiée). Pour
revenir en arrière en dev :

```sql
alter table public.kv_store_506b7b3b disable row level security;
drop trigger if exists ippoo_strip_role on auth.users;
drop function if exists public.ippoo_strip_role_from_user_metadata();
```

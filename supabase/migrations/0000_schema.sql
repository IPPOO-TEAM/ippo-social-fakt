-- IPPOO SOCIAL-FACT — Schéma de base (à exécuter EN PREMIER)
-- =========================================================================
-- Toute la plateforme stocke ses données dans UNE table key-value unique.
-- Chaque "table logique" (article, vidéo, commentaire, sondage, etc.) est un
-- PRÉFIXE de la colonne `key`. C'est le modèle standard Figma Make : l'Edge
-- Function `make-server-506b7b3b` (service_role) est le seul à y accéder.
--
-- À lancer une fois dans le SQL Editor (Dashboard auto-hébergé → SQL → Run),
-- AVANT 0001_security_hardening.sql.
-- =========================================================================

create table if not exists public.kv_store_506b7b3b (
  key   text  not null primary key,
  value jsonb not null
);

-- Index pour les recherches par préfixe (getByPrefix) — accélère
-- `where key like 'article:%'`, `comment:<id>:%`, etc.
create index if not exists kv_store_506b7b3b_key_prefix_idx
  on public.kv_store_506b7b3b (key text_pattern_ops);

-- =========================================================================
-- INVENTAIRE EXHAUSTIF des "tables logiques" (préfixes de clé) — pour mémoire.
-- Aucune n'est une vraie table SQL : ce sont les namespaces écrits par l'Edge
-- Function. Liste tirée de supabase/functions/server/index.tsx.
--
--  CONTENU ÉDITORIAL (RESOURCES) — clé `<resource>:<id>`
--    article:        Articles / actualités
--    episode:        Épisodes podcast/radio
--    video:          Vidéos
--    short:          Shorts (format vertical)
--    opportunity:    Opportunités (emplois, appels, bourses)
--    dossier:        Dossiers thématiques
--    price:          Grilles tarifaires / abonnements (admin)
--    program:        Grille des programmes live
--    page:           Pages éditoriales (CGU, à propos…)
--    theme:          Thème/branding (admin)
--    push:           Campagnes de notifications push (admin)
--    wb_post:        Bien-être — publications communautaires
--    wb_post_reply:  Bien-être — réponses aux publications
--    wb_music:       Bien-être — playlists/musiques
--    wb_track:       Bien-être — pistes audio
--
--  INTERACTIONS
--    comment:<targetId>:<commentId>    Commentaires
--    comment_like:<commentId>:<userId> Likes de commentaires
--    reaction:<targetId>:<userId>      Réactions emoji (1 par user/cible)
--    poll_vote:<pollId>:<userId>       Votes de sondage
--    view_count:<targetId>             Compteur de vues (agrégat)
--    view_seen:<targetId>:<userOrIp>   Dédup. d'incrément de vue (24h)
--
--  DONNÉES UTILISATEUR PRIVÉES — clé `user_data:<userId>:<kind>:<id>`
--    kinds : favorite, history, mood, search_recent, reaction, emoji_reaction
--    user_profile:<userId>             Profil applicatif
--
--  NOTIFICATIONS / PUSH
--    notif_inbox:<userId>:<id>         Boîte de réception in-app
--    push_sub:<userId>:<id>            Abonnements Web Push (VAPID)
--
--  ABONNEMENTS / PAIEMENTS (CinetPay)
--    subscription:<userId>             Abonnement courant
--    transaction:<id>                  Transactions de paiement
--    transaction_lookup:<ref>          Index de recherche de transaction
--    seen_webhook:<id>                 Dédup. des webhooks (idempotence)
--
--  INFRASTRUCTURE
--    config:<key>                      Configuration serveur
--    rate:<scope>:<id>                 Rate limiting
--    ip:<...>                          Suivi par IP (anti-abus)
--    log:<...>                         Journaux applicatifs
-- =========================================================================

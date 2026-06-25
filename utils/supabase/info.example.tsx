/* MODÈLE — copiez ce fichier en `info.tsx` et renseignez vos valeurs.
 *
 *   cp utils/supabase/info.example.tsx utils/supabase/info.tsx
 *
 * `info.tsx` est ignoré par git (.gitignore) pour ne pas exposer la clé sur
 * GitHub. La clé `anon` est conçue pour être publique côté client (les
 * politiques RLS protègent les données), mais on la garde hors du dépôt pour
 * éviter le blocage du « secret scanning » de GitHub.
 *
 * Où trouver ces valeurs : Dashboard Supabase → Project Settings → API
 *   - projectId      = la référence du projet (sous-domaine de l'URL)
 *   - publicAnonKey  = la clé « anon / public »
 */

export const projectId = "VOTRE_PROJECT_ID";
export const publicAnonKey = "VOTRE_CLE_ANON_PUBLIQUE";

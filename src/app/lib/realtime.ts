import { useEffect, useRef } from 'react';
import { supabase } from './api';

/**
 * S'abonne aux changements Postgres d'une table (via Supabase Realtime) et
 * appelle `onChange` à chaque INSERT/UPDATE/DELETE correspondant.
 *
 * Stratégie volontairement simple et robuste : le callback se contente de
 * redéclencher le fetch existant (qui passe par l'Edge Function). On évite
 * ainsi tout remapping de colonnes snake_case → camelCase côté client.
 *
 * Les tables concernées doivent être dans la publication `supabase_realtime`
 * (migration 0004) et avoir une policy SELECT compatible (migration 0003).
 *
 * @param table   Nom de la table publique (ex: 'comments').
 * @param filter  Filtre Realtime optionnel, ex: `target_id=eq.${id}`.
 * @param onChange Callback invoqué (débattu) à chaque changement.
 * @param enabled Désactive l'abonnement quand false.
 */
export function useRealtime(
  table: string,
  filter: string | undefined,
  onChange: () => void,
  enabled = true,
) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const fire = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => cbRef.current(), 150);
    };

    const channelName = `rt:${table}:${filter ?? 'all'}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase()
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        fire,
      )
      .subscribe();

    return () => {
      if (debounce) clearTimeout(debounce);
      try { void supabase().removeChannel(channel); } catch { /* noop */ }
    };
  }, [table, filter, enabled]);
}

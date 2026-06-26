import { useEffect, useState, useCallback, useRef } from 'react';
import { type Program } from '../data/programs';
import type { Article, Episode, Video, Opportunity, PriceItem, Short } from '../data/mock';
import type { Dossier } from '../components/views/DossierDetail';
import type { MusicTrack } from '../data/wellbeing';
import { safeStorage, STORAGE_KEYS } from '../lib/storage-safe';
import { listContent, saveContent, deleteContent, type Resource as ApiResource } from '../lib/api';

type Resource = 'articles' | 'episodes' | 'videos' | 'opportunities' | 'dossiers' | 'prices' | 'tracks' | 'shorts' | 'programs' | 'ads' | 'wb_posts';

// Local cache keys (also used as offline fallback when the API is unreachable).
const KEYS: Record<Resource, string> = {
  articles: STORAGE_KEYS.adminArticles,
  episodes: STORAGE_KEYS.adminEpisodes,
  videos: STORAGE_KEYS.adminVideos,
  opportunities: STORAGE_KEYS.adminOpportunities,
  dossiers: STORAGE_KEYS.adminDossiers,
  prices: STORAGE_KEYS.adminPrices,
  tracks: STORAGE_KEYS.adminTracks,
  shorts: STORAGE_KEYS.adminShorts,
  programs: STORAGE_KEYS.adminPrograms,
  ads: 'ippoo:admin:ads',
  wb_posts: 'ippoo:admin:wb_posts',
};

// Map admin resource (plural) → server resource (singular).
const API_RESOURCE: Record<Resource, ApiResource> = {
  articles: 'article',
  episodes: 'episode',
  videos: 'video',
  opportunities: 'opportunity',
  dossiers: 'dossier',
  prices: 'price',
  tracks: 'wb_track',
  shorts: 'short',
  programs: 'program',
  ads: 'ad',
  wb_posts: 'wb_post',
};

// Plus AUCUNE donnée de démonstration : le cache local ne contient que de
// vraies données déjà récupérées du serveur. Défaut = tableau vide.
function readCache<T>(r: Resource): T[] {
  return safeStorage.get<T[]>(KEYS[r], []);
}

type WriteError = 'quota' | 'unknown';
let lastWriteError: WriteError | null = null;
const errorListeners = new Set<(e: WriteError | null) => void>();
export function subscribeWriteError(fn: (e: WriteError | null) => void) {
  errorListeners.add(fn);
  return () => { errorListeners.delete(fn); };
}
export function getLastWriteError() { return lastWriteError; }

function writeCache<T>(r: Resource, value: T[]): void {
  const ok = safeStorage.set(KEYS[r], value);
  if (ok) {
    if (lastWriteError) { lastWriteError = null; errorListeners.forEach((fn) => fn(null)); }
  } else {
    lastWriteError = 'quota';
    errorListeners.forEach((fn) => fn('quota'));
  }
}

/**
 * useResource — API-first admin store with optimistic localStorage cache.
 * - Reads: hydrate from cache instantly, then refresh from server.
 * - Writes: optimistic local update + server call. On failure, roll back
 *   and surface the error (the offline queue in api.ts auto-retries when
 *   connectivity returns).
 * - Cross-tab sync via existing `storage:${key}` events.
 */
export function useResource<T extends { id: string }>(r: Resource) {
  const [items, setItems] = useState<T[]>(() => readCache<T>(r));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const refresh = useCallback(async () => {
    try {
      const fresh = await listContent<T>(API_RESOURCE[r], { limit: 500 });
      if (!mounted.current) return;
      setItems(fresh);
      writeCache(r, fresh);
      setError(null);
    } catch (e) {
      console.log(`[admin] refresh ${r} failed:`, e);
      if (mounted.current) setError(String((e as Error).message ?? e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [r]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Cross-tab + same-tab cache invalidation.
  useEffect(() => {
    const onLocal = () => setItems(readCache<T>(r));
    const onCross = (e: StorageEvent) => { if (e.key === KEYS[r]) setItems(readCache<T>(r)); };
    const evt = `storage:${KEYS[r]}`;
    window.addEventListener(evt, onLocal);
    window.addEventListener('storage', onCross);
    return () => {
      window.removeEventListener(evt, onLocal);
      window.removeEventListener('storage', onCross);
    };
  }, [r]);

  const commit = useCallback((next: T[]) => {
    setItems(next);
    writeCache(r, next);
  }, [r]);

  const create = useCallback(async (item: T) => {
    const next = [item, ...items];
    commit(next);
    try {
      await saveContent(API_RESOURCE[r], item.id, item);
    } catch (e) {
      console.log(`[admin] create ${r}:${item.id} failed, rolling back:`, e);
      commit(items);
      throw e;
    }
  }, [r, items, commit]);

  const update = useCallback(async (id: string, patch: Partial<T>) => {
    const prev = items;
    const merged = prev.find((x) => x.id === id);
    if (!merged) return;
    const updated = { ...merged, ...patch };
    const next = prev.map((it) => (it.id === id ? updated : it));
    commit(next);
    try {
      await saveContent(API_RESOURCE[r], id, updated);
    } catch (e) {
      console.log(`[admin] update ${r}:${id} failed, rolling back:`, e);
      commit(prev);
      throw e;
    }
  }, [r, items, commit]);

  const remove = useCallback(async (id: string) => {
    const prev = items;
    commit(prev.filter((it) => it.id !== id));
    try {
      await deleteContent(API_RESOURCE[r], id);
    } catch (e) {
      console.log(`[admin] delete ${r}:${id} failed, rolling back:`, e);
      commit(prev);
      throw e;
    }
  }, [r, items, commit]);

  // « reset » ne réinjecte plus de données de démo : il recharge simplement
  // l'état réel depuis le serveur.
  const reset = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return { items, loading, error, create, update, remove, reset, refresh };
}

export type { Article, Episode, Video, Opportunity, Dossier, PriceItem, MusicTrack, Short, Program };

import { useEffect, useState, useCallback, useRef } from 'react';
import { articles as seedArticles, episodes as seedEpisodes, videos as seedVideos, opportunities as seedOpportunities, prices as seedPrices, shorts as seedShorts } from '../data/mock';
import { seedPrograms, type Program } from '../data/programs';
import { dossiersData as seedDossiers } from '../components/views/ActuView';
import { musicTracks as seedTracks } from '../data/wellbeing';
import type { Article, Episode, Video, Opportunity, PriceItem, Short } from '../data/mock';
import type { Dossier } from '../components/views/DossierDetail';
import type { MusicTrack } from '../data/wellbeing';
import { safeStorage, STORAGE_KEYS } from '../lib/storage-safe';
import { listContent, saveContent, deleteContent, seedContent, type Resource as ApiResource } from '../lib/api';

type Resource = 'articles' | 'episodes' | 'videos' | 'opportunities' | 'dossiers' | 'prices' | 'tracks' | 'shorts' | 'programs';

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
};

const SEEDS: Record<Resource, unknown[]> = {
  articles: seedArticles,
  episodes: seedEpisodes,
  videos: seedVideos,
  opportunities: seedOpportunities,
  dossiers: seedDossiers,
  prices: seedPrices,
  tracks: seedTracks,
  shorts: seedShorts,
  programs: seedPrograms,
};

function readCache<T>(r: Resource): T[] {
  return safeStorage.get<T[]>(KEYS[r], SEEDS[r] as T[]);
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

// One-shot per session: seed the server from local mocks if the table is empty.
const seededOnce = new Set<Resource>();
async function ensureSeeded<T extends { id: string }>(r: Resource, current: T[]): Promise<void> {
  if (seededOnce.has(r) || current.length > 0) return;
  seededOnce.add(r);
  try {
    await seedContent(API_RESOURCE[r], SEEDS[r] as T[]);
  } catch (e) {
    console.log(`[admin] seed ${r} skipped:`, e);
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
      void ensureSeeded(r, fresh);
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

  const reset = useCallback(async () => {
    const seed = SEEDS[r] as T[];
    commit(seed);
    try {
      await seedContent(API_RESOURCE[r], seed);
      await refresh();
    } catch (e) {
      console.log(`[admin] reset ${r} failed:`, e);
    }
  }, [r, commit, refresh]);

  return { items, loading, error, create, update, remove, reset, refresh };
}

export type { Article, Episode, Video, Opportunity, Dossier, PriceItem, MusicTrack, Short, Program };

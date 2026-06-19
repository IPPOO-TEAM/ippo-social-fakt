import { useEffect, useState } from 'react';
import { listContent, getContent, type Resource } from './api';
import { cacheGet, cacheSet } from './offline-cache';

// Returns seed items immediately, then swaps in server items on success.
// - Empty server response (DB not seeded yet) keeps the seed visible.
// - Network failure keeps whatever was cached or the seed.
// The hook merges by id: server items override seed entries with the same id,
// brand-new server items are appended at the front.
export function useLiveContent<T extends { id: string | number }>(
  resource: Resource,
  seed: T[],
): { items: T[]; loading: boolean; refresh: () => void } {
  const [items, setItems] = useState<T[]>(seed);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `live:${resource}`;
    (async () => {
      // Cache-first to avoid an empty flash when offline / on slow networks.
      try {
        const cached = await cacheGet<T[]>(cacheKey);
        if (!cancelled && Array.isArray(cached) && cached.length) {
          setItems(merge(seed, cached));
        }
      } catch { /* ignore */ }
      try {
        const remote = await listContent<T>(resource);
        if (cancelled) return;
        const merged = merge(seed, remote);
        setItems(merged);
        void cacheSet(cacheKey, remote);
      } catch (e) {
        console.log(`useLiveContent ${resource} fetch failed:`, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resource, tick, seed]);

  return { items, loading, refresh: () => setTick((n) => n + 1) };
}

// Single-item version: returns the seed match instantly, then upgrades to the
// server item once fetched. `notFound` becomes true only when both the seed
// AND the server agree the id doesn't exist — so the 404 page never flashes
// for a freshly-published item the client hasn't pulled yet.
export function useLiveItem<T extends { id: string | number }>(
  resource: Resource,
  id: string | undefined,
  fallbackList: T[],
): { item: T | null; loading: boolean; notFound: boolean } {
  const seedMatch = id ? fallbackList.find((x) => String(x.id) === id) ?? null : null;
  const [item, setItem] = useState<T | null>(seedMatch);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setItem(null); setLoading(false); setNotFound(true); return; }
    let cancelled = false;
    setItem(seedMatch);
    setNotFound(false);
    setLoading(true);
    (async () => {
      try {
        const remote = await getContent<T>(resource, id);
        if (cancelled) return;
        if (remote) setItem(remote);
        else if (!seedMatch) setNotFound(true);
      } catch (e) {
        console.log(`useLiveItem ${resource}/${id} fetch failed:`, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // seedMatch derives synchronously from id+fallbackList, so id is the right key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, id]);

  return { item, loading, notFound };
}

function merge<T extends { id: string | number }>(seed: T[], remote: T[]): T[] {
  if (!remote.length) return seed;
  const byId = new Map<string, T>();
  for (const s of seed) byId.set(String(s.id), s);
  for (const r of remote) byId.set(String(r.id), r);
  return Array.from(byId.values());
}

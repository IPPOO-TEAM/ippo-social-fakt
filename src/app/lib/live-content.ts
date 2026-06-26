import { useEffect, useState } from 'react';
import { listContent, getContent, type Resource } from './api';
import { cacheGet, cacheSet } from './offline-cache';

// 100 % SERVER-ONLY.
// Les données proviennent EXCLUSIVEMENT du serveur (tables relationnelles). Le
// paramètre `seed` n'est plus affiché — il est ignoré et conservé uniquement
// pour compatibilité d'appel. Aucune donnée de démonstration n'est rendue.
// Le cache hors-ligne (dernière réponse serveur réelle) sert de repli réseau.
export function useLiveContent<T extends { id: string | number }>(
  resource: Resource,
  _seed?: T[],
): { items: T[]; loading: boolean; refresh: () => void } {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `live:${resource}`;
    (async () => {
      // Cache-first : réutilise la dernière réponse SERVEUR (pas un seed) pour
      // éviter un flash vide hors-ligne / sur réseau lent.
      try {
        const cached = await cacheGet<T[]>(cacheKey);
        if (!cancelled && Array.isArray(cached) && cached.length) {
          setItems(cached);
        }
      } catch { /* ignore */ }
      try {
        const remote = await listContent<T>(resource);
        if (cancelled) return;
        setItems(remote);
        void cacheSet(cacheKey, remote);
      } catch (e) {
        console.log(`useLiveContent ${resource} fetch failed:`, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resource, tick]);

  return { items, loading, refresh: () => setTick((n) => n + 1) };
}

// Version mono-élément, server-only. Le `fallbackList` est ignoré ; seul le
// serveur fait autorité. `notFound` devient vrai si le serveur ne connaît pas
// l'id.
export function useLiveItem<T extends { id: string | number }>(
  resource: Resource,
  id: string | undefined,
  _fallbackList?: T[],
): { item: T | null; loading: boolean; notFound: boolean } {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setItem(null); setLoading(false); setNotFound(true); return; }
    let cancelled = false;
    setItem(null);
    setNotFound(false);
    setLoading(true);
    (async () => {
      try {
        const remote = await getContent<T>(resource, id);
        if (cancelled) return;
        if (remote) setItem(remote);
        else setNotFound(true);
      } catch (e) {
        console.log(`useLiveItem ${resource}/${id} fetch failed:`, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resource, id]);

  return { item, loading, notFound };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { safeStorage, STORAGE_KEYS } from './storage-safe';
import { useUser } from './user';
import { bulkUserData, deleteUserData, fetchUserData, putUserData, clearUserData } from './api';

const KEY = STORAGE_KEYS.recentSearches;
const MAX = 6;

interface Entry { id: string; query: string; at: number }

// Local cache stores plain query strings for backwards compatibility with
// pre-existing localStorage payloads. We normalize to {id, query, at} in
// memory and on server.
function readLocal(): string[] {
  const raw = safeStorage.get<unknown>(KEY, []);
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string');
  return [];
}
function writeLocal(arr: string[]) { safeStorage.set(KEY, arr); }

function safeId(q: string) {
  // KV id must be ≤200 chars and URL-safe enough for path param. Hash long
  // queries by truncating; collisions are acceptable for a recent-searches list.
  const slug = q.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.slice(0, 120) || `q-${Date.now()}`;
}

export function useRecentSearches() {
  const [items, setItems] = useState<string[]>(() => readLocal());
  const { user } = useUser();
  const migratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user.authed) { migratedFor.current = null; return; }
    let cancelled = false;
    const tag = `search:${user.email ?? 'me'}`;
    (async () => {
      try {
        const { items: remote } = await fetchUserData<Entry>('search_recent');
        if (cancelled) return;
        const byQuery = new Map<string, Entry>();
        for (const e of remote) if (e?.query) byQuery.set(e.query, e);
        const local = readLocal();
        const toPush: Entry[] = [];
        for (const q of local) {
          if (!byQuery.has(q)) {
            const e: Entry = { id: safeId(q), query: q, at: Date.now() };
            byQuery.set(q, e); toPush.push(e);
          }
        }
        const merged = Array.from(byQuery.values())
          .sort((a, b) => b.at - a.at)
          .slice(0, MAX)
          .map((e) => e.query);
        writeLocal(merged);
        setItems(merged);
        if (toPush.length && migratedFor.current !== tag) {
          migratedFor.current = tag;
          await bulkUserData('search_recent', toPush).catch(() => undefined);
        }
      } catch { /* offline / anonymous */ }
    })();
    return () => { cancelled = true; };
  }, [user.authed, user.email]);

  const push = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setItems((prev) => {
      const next = [q, ...prev.filter((r) => r !== q)].slice(0, MAX);
      writeLocal(next);
      if (user.authed) {
        const entry: Entry = { id: safeId(q), query: q, at: Date.now() };
        void putUserData('search_recent', entry.id, entry).catch(() => undefined);
      }
      return next;
    });
  }, [user.authed]);

  const remove = useCallback((query: string) => {
    setItems((prev) => {
      const next = prev.filter((r) => r !== query);
      writeLocal(next);
      if (user.authed) {
        void deleteUserData('search_recent', safeId(query)).catch(() => undefined);
      }
      return next;
    });
  }, [user.authed]);

  const clear = useCallback(() => {
    writeLocal([]); setItems([]);
    if (user.authed) { void clearUserData('search_recent').catch(() => undefined); }
  }, [user.authed]);

  return { items, push, remove, clear };
}

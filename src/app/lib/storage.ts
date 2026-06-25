import { useEffect, useRef, useState, useCallback } from 'react';
import { safeStorage, STORAGE_KEYS } from './storage-safe';
import { useRealtime } from './realtime';
import { useUser } from './user';
import { emitToast } from '../components/Toast';
import {
  bulkUserData, deleteUserData, putUserData, clearUserData, fetchUserData,
  type UserDataKind,
  fetchComments, postComment, deleteComment as apiDeleteComment, toggleCommentLike,
  fetchReactions, setReaction as apiSetReaction,
  fetchViewCount, fetchViewCounts, incrementViewCount,
  type ServerComment,
} from './api';

export interface SavedItem {
  id: string;
  kind: 'article' | 'episode' | 'video' | 'opportunity' | 'dossier';
  title: string;
  image: string;
  meta?: string;
  savedAt: number;
}

const FAV_KEY = STORAGE_KEYS.favorites;
const HIST_KEY = STORAGE_KEYS.history;

function useStored<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => safeStorage.get<T>(key, fallback));

  useEffect(() => {
    const handler = () => setValue(safeStorage.get<T>(key, fallback));
    const cross = (e: StorageEvent) => { if (e.key === key) handler(); };
    window.addEventListener(`storage:${key}`, handler);
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(`storage:${key}`, handler);
      window.removeEventListener('storage', cross);
    };
  }, [key]);

  const set = useCallback((v: T) => {
    setValue(v);
    safeStorage.set(key, v);
  }, [key]);

  return [value, set];
}

// One-shot per-session migration of the local cache up to the server, the
// first time the user signs in on this device. Without this, items saved
// while anonymous would silently stop showing up on other devices.
function useServerSync<T extends { id: string; savedAt?: number }>(
  kind: UserDataKind,
  items: T[],
  setItems: (v: T[]) => void,
) {
  const { user } = useUser();
  const migratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user.authed) { migratedFor.current = null; return; }
    let cancelled = false;
    const key = `${kind}:${user.email ?? 'me'}`;
    (async () => {
      try {
        const { items: remote } = await fetchUserData<T>(kind);
        if (cancelled) return;
        const byId = new Map<string, T>();
        for (const it of remote) if (it?.id) byId.set(it.id, it);
        let mustPushLocal = false;
        for (const it of items) {
          if (it?.id && !byId.has(it.id)) { byId.set(it.id, it); mustPushLocal = true; }
        }
        const merged = Array.from(byId.values())
          .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
        setItems(merged);
        if (mustPushLocal && migratedFor.current !== key) {
          migratedFor.current = key;
          await bulkUserData(kind, items).catch(() => undefined);
        }
      } catch {
        // Network/auth blip — keep showing local cache.
      }
    })();
    return () => { cancelled = true; };
    // We intentionally key on auth identity, not `items`, to avoid refetching
    // on every mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.authed, user.email, kind]);
}

export function useFavorites() {
  const [items, setItems] = useStored<SavedItem[]>(FAV_KEY, []);
  const { user } = useUser();
  useServerSync('favorite', items, setItems);

  const has = (id: string) => items.some((i) => i.id === id);

  const toggle = (item: Omit<SavedItem, 'savedAt'>) => {
    if (has(item.id)) {
      setItems(items.filter((i) => i.id !== item.id));
      if (user.authed) { void deleteUserData('favorite', item.id).catch(() => undefined); }
    } else {
      const next: SavedItem = { ...item, savedAt: Date.now() };
      setItems([next, ...items]);
      if (user.authed) { void putUserData('favorite', item.id, next).catch(() => undefined); }
    }
  };

  const remove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    if (user.authed) { void deleteUserData('favorite', id).catch(() => undefined); }
  };

  const restore = (restored: SavedItem[]) => {
    const ids = new Set(items.map((i) => i.id));
    const merged = [...restored.filter((r) => !ids.has(r.id)), ...items];
    merged.sort((a, b) => b.savedAt - a.savedAt);
    setItems(merged);
    if (user.authed && restored.length) {
      void bulkUserData('favorite', restored).catch(() => undefined);
    }
  };

  return { items, has, toggle, remove, restore };
}

export interface Comment {
  id: string;
  targetId: string;
  author: string;
  authorId?: string;
  text: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
}

// Per-device record of which comments the current user has liked. The server
// is the source of truth for the like *count*; this flag is purely so the UI
// can render the heart filled.
const LIKED_KEY = STORAGE_KEYS.commentsLiked;

function readLiked(): Set<string> {
  return new Set(safeStorage.get<string[]>(LIKED_KEY, []));
}
function writeLiked(set: Set<string>) {
  safeStorage.set(LIKED_KEY, Array.from(set));
}

export function useComments(targetId: string) {
  const [items, setItems] = useState<Comment[]>([]);
  const [liked, setLiked] = useState<Set<string>>(() => readLiked());
  const { user } = useUser();

  const reload = useCallback(async () => {
    try {
      const { items: remote } = await fetchComments(targetId);
      setItems(remote.map((c: ServerComment) => ({ ...c })));
    } catch {
      setItems([]);
    }
  }, [targetId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items: remote } = await fetchComments(targetId);
        if (cancelled) return;
        setItems(remote.map((c: ServerComment) => ({ ...c })));
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => { cancelled = true; };
  }, [targetId]);

  // Temps réel : tout nouveau commentaire/like d'un autre client recharge la
  // liste via l'Edge Function (respecte la modération côté serveur).
  useRealtime('comments', `target_id=eq.${targetId}`, reload, !!targetId);

  const list = items
    .map((c) => ({ ...c, liked: liked.has(c.id) }))
    .sort((a, b) => b.createdAt - a.createdAt);

  const add = async (author: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const displayName = (author.trim() || user.firstName || 'Anonyme');
    if (!user.authed) {
      // Optimistic local-only comment for anonymous users. Will not persist
      // across reload — the server requires auth — but lets them see their
      // text immediately in the UI.
      const local: Comment = {
        id: `local-${Date.now()}`, targetId, author: displayName, text: trimmed,
        createdAt: Date.now(), likes: 0,
      };
      setItems((prev) => [local, ...prev]);
      return;
    }
    try {
      const { item } = await postComment(targetId, trimmed, displayName);
      setItems((prev) => [item as Comment, ...prev]);
    } catch (e) {
      console.log('postComment failed', e);
      emitToast('Commentaire enregistré localement — synchronisation serveur impossible.', 'error');
    }
  };

  const toggleLike = async (id: string) => {
    // Optimistic toggle on local flag + count.
    const wasLiked = liked.has(id);
    const nextLiked = new Set(liked);
    if (wasLiked) nextLiked.delete(id); else nextLiked.add(id);
    setLiked(nextLiked); writeLiked(nextLiked);
    setItems((prev) => prev.map((c) => c.id === id
      ? { ...c, likes: Math.max(0, c.likes + (wasLiked ? -1 : 1)) }
      : c));
    if (!user.authed) return;
    try {
      const { item } = await toggleCommentLike(targetId, id);
      // Reconcile authoritative count.
      setItems((prev) => prev.map((c) => c.id === id ? { ...c, likes: item.likes } : c));
    } catch (e) {
      console.log('toggleCommentLike failed', e);
      emitToast('Action enregistrée localement — synchronisation serveur impossible.', 'error');
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
    if (id.startsWith('local-')) return;
    if (!user.authed) return;
    try { await apiDeleteComment(targetId, id); }
    catch (e) { console.log('deleteComment failed', e); emitToast('Suppression locale — synchronisation serveur impossible.', 'error'); }
  };

  return { list, count: list.length, add, toggleLike, remove };
}

const REACT_KEY = STORAGE_KEYS.reactions;

export function useReactions() {
  const [map, setMap] = useStored<Record<string, boolean>>(REACT_KEY, {});
  const has = (id: string) => !!map[id];
  const toggle = (id: string) => setMap({ ...map, [id]: !map[id] });
  return { has, toggle, count: Object.values(map).filter(Boolean).length };
}

export const REACTION_TYPES = ['like', 'love', 'clap', 'wow', 'sad', 'angry'] as const;
export type ReactionType = typeof REACTION_TYPES[number];
export const REACTION_LABEL: Record<ReactionType, string> = {
  like: "J'aime", love: "J'adore", clap: 'Bravo', wow: 'Wow', sad: 'Triste', angry: 'En colère',
};
export const REACTION_COLOR: Record<ReactionType, string> = {
  like: '#0066FF', love: '#FF3FA4', clap: '#E8B21A', wow: '#9B51E0', sad: '#4A90E2', angry: '#FF6A00',
};

const EMOJI_REACT_KEY = STORAGE_KEYS.emojiReactions;

export function useEmojiReactions(targetId: string) {
  const [map, setMap] = useStored<Record<string, ReactionType>>(EMOJI_REACT_KEY, {});
  const { user } = useUser();
  // Authoritative counts come from the server. Until the first response lands
  // we render zeros — no synthetic seeds, ever.
  const [serverCounts, setServerCounts] = useState<Partial<Record<ReactionType, number>> | null>(null);
  const [serverMine, setServerMine] = useState<ReactionType | null | undefined>(undefined);

  const reloadReactions = useCallback(async () => {
    try {
      const r = await fetchReactions(targetId);
      setServerCounts(r.counts);
      setServerMine(r.mine);
    } catch {
      // Stay on local-only fallback.
    }
  }, [targetId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchReactions(targetId);
        if (cancelled) return;
        setServerCounts(r.counts);
        setServerMine(r.mine);
      } catch {
        // Stay on local-only fallback.
      }
    })();
    return () => { cancelled = true; };
  }, [targetId, user.authed]);

  // Temps réel : les réactions des autres utilisateurs mettent à jour les
  // compteurs sans rechargement de page.
  useRealtime('reactions', `target_id=eq.${targetId}`, reloadReactions, !!targetId);

  const localMine = map[targetId];
  const mine: ReactionType | undefined = (serverMine ?? localMine) ?? undefined;

  const counts: Record<ReactionType, number> = {
    like: 0, love: 0, clap: 0, wow: 0, sad: 0, angry: 0,
  };
  if (serverCounts) {
    for (const t of REACTION_TYPES) counts[t] = serverCounts[t] ?? 0;
  } else if (mine) {
    counts[mine] = 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = (Object.entries(counts) as [ReactionType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const set = (type: ReactionType | null) => {
    const next = { ...map };
    const wasMine = (serverMine ?? localMine) ?? null;
    if (!type || wasMine === type) {
      delete next[targetId];
      setServerMine(null);
    } else {
      next[targetId] = type;
      setServerMine(type);
    }
    setMap(next);
    // Adjust serverCounts optimistically so the UI updates immediately.
    setServerCounts((sc) => {
      const base = { ...(sc ?? {}) };
      if (wasMine) base[wasMine] = Math.max(0, (base[wasMine] ?? 0) - 1);
      const finalType = (!type || wasMine === type) ? null : type;
      if (finalType) base[finalType] = (base[finalType] ?? 0) + 1;
      return base;
    });
    if (user.authed) {
      const finalType = (!type || wasMine === type) ? null : type;
      void apiSetReaction(targetId, finalType).catch(() => undefined);
    }
  };

  return { mine, counts, total, top, set };
}

export function useHistory() {
  const [items, setItems] = useStored<SavedItem[]>(HIST_KEY, []);
  const { user } = useUser();
  useServerSync('history', items, setItems);

  const push = (item: Omit<SavedItem, 'savedAt'>) => {
    const next: SavedItem = { ...item, savedAt: Date.now() };
    const filtered = items.filter((i) => i.id !== item.id);
    const trimmed = [next, ...filtered].slice(0, 50);
    setItems(trimmed);
    if (user.authed) { void putUserData('history', item.id, next).catch(() => undefined); }
  };

  const clear = () => {
    setItems([]);
    if (user.authed) { void clearUserData('history').catch(() => undefined); }
  };
  const remove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    if (user.authed) { void deleteUserData('history', id).catch(() => undefined); }
  };

  const restore = (restored: SavedItem[]) => {
    const ids = new Set(items.map((i) => i.id));
    const merged = [...restored.filter((r) => !ids.has(r.id)), ...items];
    merged.sort((a, b) => b.savedAt - a.savedAt);
    setItems(merged.slice(0, 50));
    if (user.authed && restored.length) {
      void bulkUserData('history', restored).catch(() => undefined);
    }
  };

  return { items, push, clear, remove, restore };
}

// View counters — single counter per content id. Increment is server-deduped
// per user/IP for 24h, so calling this on every mount is safe.
export function useViewCount(targetId: string, opts: { increment?: boolean } = {}) {
  const { increment = true } = opts;
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    (async () => {
      try {
        if (increment) {
          const r = await incrementViewCount(targetId);
          if (!cancelled) setTotal(r.total);
        } else {
          const r = await fetchViewCount(targetId);
          if (!cancelled) setTotal(r.total);
        }
      } catch {
        // Stay on null — UI can fall back to whatever it already shows.
      }
    })();
    return () => { cancelled = true; };
  }, [targetId, increment]);

  return total;
}

export function useViewCounts(ids: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = ids.join(',');
  useEffect(() => {
    if (!ids.length) { setCounts({}); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchViewCounts(ids);
        if (!cancelled) setCounts(r.counts ?? {});
      } catch {
        if (!cancelled) setCounts({});
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return counts;
}

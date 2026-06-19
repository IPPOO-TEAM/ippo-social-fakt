import { useEffect, useRef, useState, useCallback } from 'react';
import {
  seedPosts, seedResponses,
  type WellbeingPost, type WellbeingResponse, type Mood,
} from '../data/wellbeing';
import { safeStorage, STORAGE_KEYS } from './storage-safe';
import { useUser } from './user';
import { bulkUserData, deleteContent, fetchUserData, listContent, putUserData, saveContent } from './api';
import { emitToast } from '../components/Toast';

const POSTS_KEY = STORAGE_KEYS.wbPosts;
const RESP_KEY  = STORAGE_KEYS.wbResponses;
const HELP_KEY  = STORAGE_KEYS.wbHelpful;
const MOOD_KEY  = STORAGE_KEYS.wbMoodlog;

function read<T>(key: string, fallback: T[]): T[] {
  return safeStorage.get<T[]>(key, fallback);
}

function write(key: string, value: unknown) {
  safeStorage.set(key, value);
}

function useStored<T>(key: string, fallback: T[]) {
  const [items, setItems] = useState<T[]>(() => read<T>(key, fallback));
  useEffect(() => {
    const h = () => setItems(read<T>(key, fallback));
    const cross = (e: StorageEvent) => { if (e.key === key) h(); };
    window.addEventListener(`storage:${key}`, h);
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(`storage:${key}`, h);
      window.removeEventListener('storage', cross);
    };
  }, [key, fallback]);
  return [items, setItems] as const;
}

export function useWellbeing() {
  const [posts, setPosts] = useStored<WellbeingPost>(POSTS_KEY, seedPosts);
  const [responses, setResponses] = useStored<WellbeingResponse>(RESP_KEY, seedResponses);
  const [helpful, setHelpful] = useStored<string>(HELP_KEY, []);

  // Live sync from server: posts and replies are stored as `wb_post` and
  // `wb_post_reply` content. Seed data is kept as a fallback and merged by id.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [remotePosts, remoteResps] = await Promise.all([
          listContent<WellbeingPost>('wb_post'),
          listContent<WellbeingResponse>('wb_post_reply'),
        ]);
        if (cancelled) return;
        if (remotePosts.length) {
          const byId = new Map<string, WellbeingPost>();
          for (const p of seedPosts) byId.set(p.id, p);
          for (const p of remotePosts) byId.set(p.id, p);
          const merged = Array.from(byId.values());
          write(POSTS_KEY, merged);
          setPosts(merged);
        }
        if (remoteResps.length) {
          const byId = new Map<string, WellbeingResponse>();
          for (const r of seedResponses) byId.set(r.id, r);
          for (const r of remoteResps) byId.set(r.id, r);
          const merged = Array.from(byId.values());
          write(RESP_KEY, merged);
          setResponses(merged);
        }
      } catch (e) { console.log('wellbeing fetch failed:', e); }
    })();
    return () => { cancelled = true; };
  }, [setPosts, setResponses]);

  const addPost = useCallback(async (p: WellbeingPost) => {
    const next = [p, ...read<WellbeingPost>(POSTS_KEY, seedPosts)];
    write(POSTS_KEY, next);
    setPosts(next);
    try { await saveContent('wb_post', p.id, p); }
    catch (e) { console.log('addPost server save failed:', e); emitToast('Publication enregistrée localement — synchronisation serveur impossible.', 'error'); }
  }, [setPosts]);

  const setMoodAfter = useCallback((postId: string, m: Mood) => {
    const next = read<WellbeingPost>(POSTS_KEY, seedPosts).map((p) =>
      p.id === postId ? { ...p, moodAfter: m } : p,
    );
    write(POSTS_KEY, next);
    setPosts(next);
  }, [setPosts]);

  const addResponse = useCallback(async (r: WellbeingResponse) => {
    const next = [...read<WellbeingResponse>(RESP_KEY, seedResponses), r];
    write(RESP_KEY, next);
    setResponses(next);
    try { await saveContent('wb_post_reply', r.id, r); }
    catch (e) { console.log('addResponse server save failed:', e); emitToast('Réponse enregistrée localement — synchronisation serveur impossible.', 'error'); }
  }, [setResponses]);

  const toggleHelpful = useCallback(async (respId: string) => {
    const list = read<string>(HELP_KEY, []);
    const isOn = list.includes(respId);
    const nextList = isOn ? list.filter((id) => id !== respId) : [...list, respId];
    write(HELP_KEY, nextList);
    setHelpful(nextList);

    const nextResps = read<WellbeingResponse>(RESP_KEY, seedResponses).map((r) =>
      r.id === respId ? { ...r, helpful: r.helpful + (isOn ? -1 : 1) } : r,
    );
    write(RESP_KEY, nextResps);
    setResponses(nextResps);
    const updated = nextResps.find((r) => r.id === respId);
    if (updated) {
      try { await saveContent('wb_post_reply', updated.id, updated); }
      catch (e) { console.log('toggleHelpful server save failed:', e); emitToast('Action enregistrée localement — synchronisation serveur impossible.', 'error'); }
    }
  }, [setHelpful, setResponses]);

  const responsesFor = useCallback(
    (postId: string) => responses.filter((r) => r.postId === postId),
    [responses],
  );

  const removePost = useCallback(async (id: string) => {
    const nextPosts = read<WellbeingPost>(POSTS_KEY, seedPosts).filter((p) => p.id !== id);
    write(POSTS_KEY, nextPosts);
    setPosts(nextPosts);
    const nextResps = read<WellbeingResponse>(RESP_KEY, seedResponses).filter((r) => r.postId !== id);
    write(RESP_KEY, nextResps);
    setResponses(nextResps);
    try { await deleteContent('wb_post', id); }
    catch (e) { console.log('removePost server delete failed:', e); emitToast('Suppression locale — synchronisation serveur impossible.', 'error'); }
  }, [setPosts, setResponses]);

  const removeResponse = useCallback(async (id: string) => {
    const next = read<WellbeingResponse>(RESP_KEY, seedResponses).filter((r) => r.id !== id);
    write(RESP_KEY, next);
    setResponses(next);
    try { await deleteContent('wb_post_reply', id); }
    catch (e) { console.log('removeResponse server delete failed:', e); emitToast('Suppression locale — synchronisation serveur impossible.', 'error'); }
  }, [setResponses]);

  return { posts, responses, helpful, addPost, setMoodAfter, addResponse, toggleHelpful, responsesFor, removePost, removeResponse };
}

export interface MoodEntry { id: string; date: string; calm: number; energy: number; }

export function useMoodLog() {
  const [entries, setEntries] = useStored<MoodEntry>(MOOD_KEY, []);
  const { user } = useUser();
  const migratedFor = useRef<string | null>(null);

  // Sync server mood log on auth; merge any local-only entries up to the
  // account once so they aren't lost.
  useEffect(() => {
    if (!user.authed) { migratedFor.current = null; return; }
    let cancelled = false;
    const tag = `mood:${user.email ?? 'me'}`;
    (async () => {
      try {
        const { items: remote } = await fetchUserData<MoodEntry>('mood');
        if (cancelled) return;
        const byId = new Map<string, MoodEntry>();
        for (const e of remote) if (e?.id) byId.set(e.id, e);
        const local = read<MoodEntry>(MOOD_KEY, []);
        let toPush: MoodEntry[] = [];
        for (const e of local) {
          const id = e.id ?? e.date;
          if (!id) continue;
          const normalized = { ...e, id };
          if (!byId.has(id)) { byId.set(id, normalized); toPush.push(normalized); }
        }
        const merged = Array.from(byId.values())
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-60);
        write(MOOD_KEY, merged);
        setEntries(merged);
        if (toPush.length && migratedFor.current !== tag) {
          migratedFor.current = tag;
          await bulkUserData('mood', toPush).catch(() => undefined);
        }
      } catch {
        // Keep local cache.
      }
    })();
    return () => { cancelled = true; };
  }, [user.authed, user.email, setEntries]);

  const log = useCallback((m: Mood) => {
    const date = new Date().toISOString();
    const entry: MoodEntry = { id: date, date, ...m };
    const next = [...read<MoodEntry>(MOOD_KEY, []), entry].slice(-60);
    write(MOOD_KEY, next);
    setEntries(next);
    if (user.authed) { void putUserData('mood', entry.id, entry).catch(() => undefined); }
  }, [setEntries, user.authed]);
  return { entries, log };
}

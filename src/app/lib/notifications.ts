import { useEffect, useRef, useState, useCallback } from 'react';
import { Newspaper, Mic, Calendar, AlertTriangle, Sparkles, type LucideIcon } from 'lucide-react';
import { safeStorage, STORAGE_KEYS } from './storage-safe';
import { fetchInbox, markNotifsRead, type InboxNotif } from './api';
import { useRealtime } from './realtime';
import { useUser } from './user';
import { emitToast } from '../components/Toast';

export interface Notif {
  id: string;
  iconKey: 'news' | 'podcast' | 'event' | 'alert' | 'opportunity';
  color: string;
  title: string;
  time: string;
  read: boolean;
}

const KEY = STORAGE_KEYS.notifications;

const ICONS: Record<Notif['iconKey'], LucideIcon> = {
  news: Newspaper, podcast: Mic, event: Calendar, alert: AlertTriangle, opportunity: Sparkles,
};

export function notifIcon(k: Notif['iconKey']) { return ICONS[k]; }

// Aucune donnée de démonstration : les notifications proviennent uniquement du
// serveur (inbox). Le cache local ne contient que de vraies notifications déjà
// reçues, pour l'affichage hors-ligne.
function read(): Notif[] {
  return safeStorage.get<Notif[]>(KEY, []);
}

function write(arr: Notif[]) {
  safeStorage.set(KEY, arr);
}

function fromInbox(n: InboxNotif): Notif {
  // The server stores absolute timestamps; format relatively for display.
  const diff = Math.max(0, Date.now() - n.sentAt);
  const min = Math.floor(diff / 60_000);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  const time =
    min < 1 ? 'À l\'instant'
    : min < 60 ? `Il y a ${min} min`
    : hour < 24 ? `Il y a ${hour} h`
    : `Il y a ${day} j`;
  return {
    id: n.id,
    iconKey: (n.iconKey as Notif['iconKey']) ?? 'news',
    color: n.color ?? '#0066FF',
    title: n.title,
    time,
    read: n.read,
  };
}

export function useNotifications() {
  const { user } = useUser();
  const [items, setItems] = useState<Notif[]>(() => read());
  // Server is authoritative once we successfully fetch; until then we
  // render the local cache so the bell doesn't flicker empty on cold start.
  const [serverBacked, setServerBacked] = useState(false);

  useEffect(() => {
    const h = () => { if (!serverBacked) setItems(read()); };
    const cross = (e: StorageEvent) => { if (e.key === KEY) h(); };
    window.addEventListener(`storage:${KEY}`, h);
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(`storage:${KEY}`, h);
      window.removeEventListener('storage', cross);
    };
  }, [serverBacked]);

  // IDs déjà connus : sert à ne toaster QUE les notifications réellement
  // nouvelles (pas tout le lot au premier chargement).
  const knownIds = useRef<Set<string> | null>(null);

  const sync = useCallback(async () => {
    // L'inbox exige une session : ne pas appeler en anonyme (évite les 401).
    if (!user.authed) return;
    try {
      const r = await fetchInbox();
      const mapped = r.items.map(fromInbox);
      // Toast flottant pour chaque nouvelle notification non lue.
      if (knownIds.current === null) {
        knownIds.current = new Set(mapped.map((n) => n.id));
      } else {
        for (const n of mapped) {
          if (!knownIds.current.has(n.id)) {
            knownIds.current.add(n.id);
            if (!n.read) emitToast(n.title, 'info');
          }
        }
      }
      setItems(mapped);
      setServerBacked(true);
      write(mapped);
    } catch {
      // Anonymous user or network down — keep the local cache.
    }
  }, [user.authed]);

  useEffect(() => {
    sync();
    const onFocus = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', sync);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', sync);
    };
  }, [sync]);

  // Temps réel : nouvelle notification serveur → la cloche se met à jour.
  // Le RLS limite déjà la diffusion aux notifications de l'utilisateur courant.
  useRealtime('notifications', undefined, sync, user.authed);

  const markRead = (id: string) => {
    const next = items.map((n) => n.id === id ? { ...n, read: true } : n);
    write(next); setItems(next);
    if (serverBacked) { void markNotifsRead({ ids: [id] }).catch(() => undefined); }
  };
  const markAllRead = () => {
    const next = items.map((n) => ({ ...n, read: true }));
    write(next); setItems(next);
    if (serverBacked) { void markNotifsRead({ all: true }).catch(() => undefined); }
  };
  const clear = () => { write([]); setItems([]); };

  const unread = items.filter((n) => !n.read).length;
  return { items, unread, markRead, markAllRead, clear };
}

import { useEffect, useState } from 'react';
import { Newspaper, Mic, Calendar, AlertTriangle, Sparkles, type LucideIcon } from 'lucide-react';
import { safeStorage, STORAGE_KEYS } from './storage-safe';
import { fetchInbox, markNotifsRead, type InboxNotif } from './api';

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

const seed: Notif[] = [
  { id: 'n1', iconKey: 'news', color: '#0066FF', title: 'Nouvel article · Marché de Dantokpa', time: 'Il y a 12 min', read: false },
  { id: 'n2', iconKey: 'podcast', color: '#FF3FA4', title: 'Nouveau podcast disponible', time: 'Il y a 1h', read: false },
  { id: 'n3', iconKey: 'event', color: '#00C853', title: 'Diaspora : webinaire Africa Investing demain 18h', time: 'Il y a 3h', read: false },
  { id: 'n4', iconKey: 'alert', color: '#E8B21A', title: 'Coupure d\'eau prévue à Akpakpa', time: 'Il y a 5h', read: false },
];

function read(): Notif[] {
  return safeStorage.get<Notif[]>(KEY, seed);
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

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const r = await fetchInbox();
        if (cancelled) return;
        const mapped = r.items.map(fromInbox);
        setItems(mapped);
        setServerBacked(true);
        write(mapped);
      } catch {
        // Anonymous user or network down — keep the local cache.
      }
    };
    sync();
    const onFocus = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', sync);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', sync);
    };
  }, []);

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

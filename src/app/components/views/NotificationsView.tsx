import { useMemo, useState } from 'react';
import { ChevronLeft, CheckCheck, BellOff, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useNotifications, notifIcon, type Notif } from '../../lib/notifications';
import { useT } from '../../lib/i18n';

interface Props { onBack?: () => void }

type FilterKey = 'all' | 'unread';

function dayBucket(sentAt?: number): string {
  if (!sentAt) return 'Plus anciennes';
  const now = new Date();
  const d = new Date(sentAt);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  const startWeek = startToday - 7 * 86_400_000;
  if (sentAt >= startToday) return "Aujourd'hui";
  if (sentAt >= startYesterday) return 'Hier';
  if (sentAt >= startWeek) return 'Cette semaine';
  return 'Plus anciennes';
}

const BUCKET_ORDER = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus anciennes'];

export function NotificationsView({ onBack }: Props) {
  const navigate = useNavigate();
  const t = useT();
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>('all');

  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Notif[]>();
    for (const n of visible) {
      const b = dayBucket(n.sentAt);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(n);
    }
    return BUCKET_ORDER
      .filter((b) => map.has(b))
      .map((b) => ({ label: b, items: map.get(b)! }));
  }, [visible]);

  const onOpen = (n: Notif) => {
    if (!n.read) markRead(n.id);
    if (n.url && n.url !== '/') navigate(n.url);
  };

  const back = () => (onBack ? onBack() : navigate(-1));

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#F0F0F0]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={back} aria-label="Retour" className="w-9 h-9 -ml-2 flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              {t('header.notifs')}
            </h1>
            <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
              {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5EFFF] text-[#0066FF]"
              style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <CheckCheck size={14} /> Tout lire
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 px-4 pb-3">
          {([['all', 'Toutes'], ['unread', 'Non lues']] as [FilterKey, string][]).map(([key, label]) => {
            const on = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3.5 py-1.5 transition-colors"
                style={{
                  background: on ? '#1a1a1a' : '#F4F4F6',
                  color: on ? 'white' : '#717182',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: on ? 700 : 500, borderRadius: 999,
                }}
              >
                {label}{key === 'unread' && unread > 0 ? ` · ${unread}` : ''}
              </button>
            );
          })}
        </div>
      </header>

      {/* Contenu */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8" style={{ minHeight: '60vh' }}>
          <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ background: '#F4F4F6', borderRadius: 999 }}>
            <BellOff size={26} className="text-[#9A9AA8]" />
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </div>
          <p className="text-[#717182] mt-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', maxWidth: 280 }}>
            Vous serez prévenu·e ici dès qu'un nouvel article, épisode ou événement sera publié.
          </p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5 pb-24">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="px-1 mb-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {g.label}
              </h2>
              <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]" style={{ borderRadius: 14, overflow: 'hidden' }}>
                {g.items.map((n) => {
                  const Icon = notifIcon(n.iconKey);
                  return (
                    <button
                      key={n.id}
                      onClick={() => onOpen(n)}
                      className="w-full text-left flex items-start gap-3 px-3.5 py-3.5 transition-colors hover:bg-[#FAFAFA] relative"
                      style={{ background: n.read ? undefined : 'rgba(0,102,255,0.04)' }}
                    >
                      {!n.read && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5" style={{ background: '#0066FF', borderRadius: 999 }} />
                      )}
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${n.color}1A`, borderRadius: 11 }}>
                        <Icon size={17} style={{ color: n.color }} strokeWidth={2.4} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: n.read ? 600 : 800, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                          {n.title}
                        </div>
                        {n.body && (
                          <div className="line-clamp-2 mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#717182', lineHeight: 1.35 }}>
                            {n.body}
                          </div>
                        )}
                        <div className="mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: '#9A9AA8' }}>
                          {n.time}
                        </div>
                      </div>
                      {n.url && n.url !== '/' && (
                        <ChevronRight size={16} className="text-[#C7C7CF] flex-shrink-0 self-center" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

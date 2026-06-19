import { Bell, X, Search, User, Menu, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import logoUrl from '../../imports/social_fact_logo.png';
import logoDarkUrl from '../../imports/social_fact_logo_drak_mode.png';
import { useNotifications, notifIcon } from '../lib/notifications';
import { useTheme } from '../lib/theme';
import { useT } from '../lib/i18n';
import { LangSwitcher } from './LangSwitcher';

interface Props {
  title?: string;
  showAlert?: boolean;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onOpenMenu?: () => void;
}

export function AppHeader({ title, onOpenSearch, onOpenProfile, onOpenMenu }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { items: notifications, unread, markRead, markAllRead } = useNotifications();
  const { isDark } = useTheme();
  const t = useT();

  const iconBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 9999,
    background: 'transparent', color: 'var(--foreground)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(60, 60, 67, 0.18)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {onOpenProfile ? (
            <button
              onClick={onOpenProfile}
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--secondary)', color: 'var(--foreground)' }}
              aria-label={t('common.profile')}
            >
              <User size={16} />
            </button>
          ) : (
            <img src={isDark ? logoDarkUrl : logoUrl} alt="IPPOO" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          )}
          {title && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onOpenMenu && (
            <button onClick={onOpenMenu} style={iconBtn} aria-label={t('header.menu')}>
              <Menu size={18} />
            </button>
          )}
          {onOpenSearch && (
            <button onClick={onOpenSearch} style={iconBtn} aria-label={t('common.search')}>
              <Search size={18} />
            </button>
          )}
          <LangSwitcher />
          <button onClick={() => setNotifOpen((v) => !v)} style={{ ...iconBtn, position: 'relative' }} aria-label={t('header.notifs')}>
            <Bell size={18} />
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center"
                style={{
                  minWidth: 16, height: 16, padding: '0 4px',
                  background: 'var(--x-blue, #1D9BF0)', color: '#fff',
                  borderRadius: 9999,
                  fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800,
                }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {notifOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotifOpen(false)} className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.4)' }} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-3 mt-2 w-80 max-w-[calc(100vw-1.5rem)] z-40"
              style={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'var(--foreground)' }}>{t('header.notifs')}</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1" style={{ color: 'var(--x-blue, #1D9BF0)', fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700 }}>
                      <CheckCheck size={13} /> {t('header.read_all')}
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} aria-label={t('common.close')} style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center" style={{ color: 'var(--muted-foreground)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                    {t('header.no_notif')}
                  </div>
                ) : notifications.map((n) => {
                  const Icon = notifIcon(n.iconKey);
                  return (
                    <button
                      key={n.id}
                      onClick={() => { markRead(n.id); setNotifOpen(false); }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left"
                      style={{ borderBottom: '1px solid var(--border)', background: !n.read ? 'color-mix(in srgb, var(--x-blue, #1D9BF0) 8%, transparent)' : 'transparent' }}
                    >
                      <div className="flex items-center justify-center flex-shrink-0 relative" style={{ width: 36, height: 36, borderRadius: 9999, background: `${n.color}1A` }}>
                        <Icon size={16} style={{ color: n.color }} />
                        {!n.read && <span className="absolute -top-0.5 -right-0.5" style={{ width: 8, height: 8, background: 'var(--x-blue, #1D9BF0)', borderRadius: 9999, boxShadow: '0 0 0 2px var(--background)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: n.read ? 500 : 700, color: 'var(--foreground)', lineHeight: 1.3 }}>{n.title}</div>
                        <div style={{ color: 'var(--muted-foreground)', fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', marginTop: 2 }}>{n.time}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

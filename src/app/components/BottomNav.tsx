import { Home, Search, Bell, Mail, LayoutGrid } from 'lucide-react';
import { tap } from '../lib/haptic';
import { useT } from '../lib/i18n';

export type ViewKey = 'home' | 'actu' | 'podcast' | 'videos' | 'more';

const items: { key: ViewKey; tKey: string; icon: typeof Home }[] = [
  { key: 'home', tKey: 'nav.home', icon: Home },
  { key: 'actu', tKey: 'nav.actu', icon: Search },
  { key: 'podcast', tKey: 'nav.podcast', icon: Bell },
  { key: 'videos', tKey: 'nav.videos', icon: Mail },
  { key: 'more', tKey: 'nav.more', icon: LayoutGrid },
];

interface Props {
  current: ViewKey;
  onChange: (k: ViewKey) => void;
  hasMiniPlayer?: boolean;
}

export function BottomNav({ current, onChange }: Props) {
  const t = useT();
  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-40"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid rgba(60, 60, 67, 0.18)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {items.map(({ key, tKey, icon: Icon }) => {
          const active = current === key;
          const label = t(tKey);
          return (
            <button
              key={key}
              onClick={() => { tap(); onChange(key); }}
              className="flex items-center justify-center py-3.5 transition-colors"
              style={{
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={26}
                strokeWidth={active ? 2.5 : 2}
                fill={active ? 'currentColor' : 'none'}
                fillOpacity={active ? 1 : 0}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

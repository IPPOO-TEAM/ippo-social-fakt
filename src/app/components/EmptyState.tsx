import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  accent?: string;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, onCta, accent = '#0066FF' }: Props) {
  return (
    <div className="px-6 py-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ background: `${accent}12`, borderRadius: 999 }}>
        <Icon size={26} style={{ color: accent }}/>
      </div>
      <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {description && (
        <p className="text-[#717182] mt-1.5 max-w-xs" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-5 px-5 py-2.5 text-white"
          style={{ background: accent, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="px-8 py-6 border-b border-[#EAEAEE] bg-white flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <div className="mt-0.5" style={{ color: '#717182', fontSize: '0.85rem' }}>
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

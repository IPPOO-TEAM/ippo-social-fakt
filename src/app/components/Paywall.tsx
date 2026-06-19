import { Crown, Lock, Check } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  perks?: string[];
  onUpgrade: () => void;
}

export function Paywall({ title = 'Contenu réservé aux Premium', message = 'Soutenez le journalisme béninois et débloquez tous nos contenus exclusifs.', perks, onUpgrade }: Props) {
  const list = perks ?? ['Sans publicité', 'Podcasts illimités', 'Dossiers complets', 'Hors-ligne'];
  return (
    <div className="px-5 py-6">
      <div className="relative overflow-hidden p-5 text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a1648 60%, #FF3FA4 100%)', borderRadius: 'var(--r-xl)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
            <Lock size={17} />
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            {title}
          </div>
        </div>
        <div className="text-white/85" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.5 }}>
          {message}
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-3.5">
          {list.map((p) => (
            <div key={p} className="flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem' }}>
              <Check size={12} className="text-[#00FF94]" strokeWidth={3} />
              <span className="text-white/85">{p}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onUpgrade}
          className="w-full mt-4 py-3 bg-white text-[#1a1a1a] flex items-center justify-center gap-2"
          style={{ borderRadius: 'var(--r-pill)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}
        >
          <Crown size={15} className="text-[#FF3FA4]" /> Passer Premium
        </button>
      </div>
    </div>
  );
}

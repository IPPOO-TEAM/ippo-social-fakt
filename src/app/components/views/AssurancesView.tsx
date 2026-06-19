import { ChevronLeft, ChevronRight, CalendarCheck, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { assurances } from '../../data/assurances';

interface Props {
  onBack: () => void;
  onOpen: (slug: string) => void;
}

export function AssurancesView({ onBack, onOpen }: Props) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label="Retour">
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          Micro-assurances
        </h1>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          IPPOO Assurances
        </div>
        <h2 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          Se protéger, simplement.
        </h2>
        <p className="mt-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.5 }}>
          12 produits pensés pour les travailleurs du secteur informel, les familles et la diaspora. Échangez avec un conseiller pour trouver la couverture adaptée.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <a href="tel:+229 2722000000" className="flex items-center gap-2 px-3 py-2.5 bg-[#0066FF] text-white" style={{ borderRadius: 12 }}>
            <CalendarCheck size={16} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 700 }}>Prendre rendez-vous</span>
          </a>
          <a href="https://maps.google.com/?q=IPPOO+Assurances+Cotonou" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-white text-[#1a1a1a]" style={{ borderRadius: 12, border: '1px solid #EAEAEE' }}>
            <MapPin size={16} className="text-[#0066FF]" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 700 }}>Consulter notre agence</span>
          </a>
        </div>

      </div>

      <div className="px-5 mt-6 pb-10 grid grid-cols-2 gap-3">
        {assurances.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => onOpen(a.slug)}
              className="bg-white border border-[#F0F0F0] p-4 text-left hover:border-[#0066FF]/40 transition-colors flex flex-col"
              style={{ borderRadius: 14 }}
            >
              <div className="w-11 h-11 flex items-center justify-center mb-3" style={{ background: a.bg, borderRadius: 11 }}>
                <Icon size={19} style={{ color: a.color }} strokeWidth={2.4} />
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                {a.name}
              </div>
              <div className="text-[#717182] mt-1 mb-3 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', lineHeight: 1.35 }}>
                {a.tagline}
              </div>
              <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#F0F0F0]">
                <div className="flex items-center gap-1.5" style={{ color: a.color }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700 }}>En savoir plus</span>
                </div>
                <ChevronRight size={16} style={{ color: a.color }} />
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

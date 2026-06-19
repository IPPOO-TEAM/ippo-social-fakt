import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Check, Users, ShieldCheck, X, CalendarCheck, MapPin, Phone } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Assurance } from '../../data/assurances';
import { useToast } from '../Toast';

interface Props {
  assurance: Assurance;
  onBack: () => void;
}

export function AssuranceDetail({ assurance: a, onBack }: Props) {
  const Icon = a.icon;
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    setName(''); setPhone(''); setDate('');
    toast(`Rendez-vous demandé pour ${a.name}. Un conseiller vous rappelle pour confirmer.`);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <ImageWithFallback src={a.hero} alt={a.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)' }} />
        <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Retour">
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <div className="absolute bottom-4 left-5 right-5 flex items-end gap-3">
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: a.bg, borderRadius: 12 }}>
            <Icon size={22} style={{ color: a.color }} strokeWidth={2.4} />
          </div>
          <div className="text-white">
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85 }}>
              IPPOO Assurance
            </div>
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.7rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {a.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', lineHeight: 1.55 }}>
          {a.description}
        </p>

        <div className="mt-5 p-4" style={{ background: a.bg, borderRadius: 14 }}>
          <div className="flex items-center gap-2 mb-2">
            <Phone size={15} style={{ color: a.color }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>
              Devis personnalisé en agence
            </span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#1a1a1a', lineHeight: 1.5 }}>
            Nos conseillers étudient votre situation et vous proposent une cotisation adaptée. Aucune obligation, échange gratuit.
          </p>
        </div>

        <h3 className="mt-7 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Ce que ça couvre
        </h3>
        <ul className="space-y-2.5">
          {a.coverage.map((c) => (
            <li key={c} className="flex items-start gap-2.5">
              <div className="w-5 h-5 mt-0.5 flex items-center justify-center flex-shrink-0" style={{ background: a.bg, borderRadius: 999 }}>
                <Check size={13} style={{ color: a.color }} strokeWidth={3} />
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.5 }}>{c}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-7 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Avantages clés
        </h3>
        <div className="space-y-3">
          {a.benefits.map((b) => (
            <div key={b.title} className="p-4 bg-[#FAFAFA]" style={{ borderRadius: 12 }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>{b.title}</div>
              <div className="mt-1 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', lineHeight: 1.5 }}>{b.description}</div>
            </div>
          ))}
        </div>

        <h3 className="mt-7 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Pour qui ?
        </h3>
        <div className="flex flex-wrap gap-2 mb-7">
          {a.audience.map((aud) => (
            <span key={aud} className="px-3 py-1.5 bg-[#F4F4F6]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 500, color: '#1a1a1a', borderRadius: 999 }}>
              <Users size={12} className="inline mr-1.5 -mt-0.5" />
              {aud}
            </span>
          ))}
        </div>

        <div className="mb-7 p-4 bg-[#F4F4F6]" style={{ borderRadius: 12 }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={15} className="text-[#0066FF]" />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>
              Partenaires
            </span>
          </div>
          <div className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', lineHeight: 1.55 }}>
            {a.partners.join(' · ')}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#F0F0F0] p-4 flex items-center gap-2" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <a
          href="https://maps.google.com/?q=IPPOO+Assurances+Cotonou"
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-[#1a1a1a]"
          style={{ background: 'white', border: '1px solid #EAEAEE', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: 999 }}
        >
          <MapPin size={15} style={{ color: a.color }} />
          Consulter notre agence
        </a>
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-white"
          style={{ background: a.color, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem', borderRadius: 999 }}
        >
          <CalendarCheck size={15} />
          Prendre rendez-vous
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md p-5" style={{ borderRadius: '14px 14px 0 0' }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                  Prendre rendez-vous · {a.name}
                </div>
                <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
                  Un conseiller vous rappelle pour confirmer le créneau.
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center -mr-2 -mt-1">
                <X size={18} className="text-[#717182]" />
              </button>
            </div>
            <div className="space-y-3 mt-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom complet"
                required
                className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none"
                style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numéro de téléphone"
                required
                type="tel"
                className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none"
                style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
              />
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                type="datetime-local"
                className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none"
                style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="w-full py-3 mt-4 text-white flex items-center justify-center gap-2" style={{ background: a.color, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem', borderRadius: 999 }}>
              <CalendarCheck size={15} />
              Demander le rendez-vous
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}

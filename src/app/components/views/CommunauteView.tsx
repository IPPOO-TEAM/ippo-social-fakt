import { motion } from 'motion/react';
import { ChevronLeft, MessageSquare, Mic, Video, Send, BadgeCheck, Award, MapPin, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useToast } from '../Toast';
import { useT } from '../../lib/i18n';

interface Props { onBack: () => void; }

const tribunes = [
  { id: 't1', kind: 'audio', author: 'Awa Touré', verified: true, badge: 'Contributrice', text: 'Nos coopératives de femmes mutualisent leurs achats, voici ce qui change concrètement chez nous.', image: 'https://images.unsplash.com/photo-1573164574230-db1d5e960238?w=600&q=80', likes: 142, comments: 28 },
  { id: 't2', kind: 'texte', author: 'Ibrahim Sow', verified: false, badge: 'Témoin', text: 'À Akpakpa, les jeunes du quartier organisent un salon de l\'orientation entièrement gratuit ce week-end.', image: '', likes: 87, comments: 19 },
  { id: 't3', kind: 'video', author: 'Fatou N.', verified: true, badge: 'Reporter', text: 'Reportage vidéo : la nouvelle génération d\'agriculteurs urbains à Ouidah.', image: 'https://images.unsplash.com/photo-1530507629858-e3759c2e4e92?w=600&q=80', likes: 234, comments: 41 },
];

const annonces = [
  { id: 'an1', cat: 'Emploi', title: 'Cherche apprenti·e couture', meta: 'Dantokpa · Aujourd\'hui', tone: '#0066FF' },
  { id: 'an2', cat: 'Vente', title: 'Stock tissus pagne wax', meta: 'Saint-Michel · Hier', tone: '#FF8A00' },
  { id: 'an3', cat: 'Immobilier', title: 'Local commercial 22 m²', meta: 'Cadjèhoun · 2 jours', tone: '#9B51E0' },
  { id: 'an4', cat: 'Événement', title: 'Atelier mentorat lycéens', meta: 'Plateau · Sam. 14h', tone: '#00C853' },
];

const questions = [
  { q: 'Comment ouvrir un compte mobile money sans pièce d\'identité ?', answers: 12, expert: true },
  { q: 'Quelles aides existent pour les coopératives de marché ?', answers: 7, expert: true },
  { q: 'Où signaler une coupure d\'eau récurrente ?', answers: 23, expert: false },
];

export function CommunauteView({ onBack }: Props) {
  const [tab, setTab] = useState<'tribunes' | 'annonces' | 'qa' | 'partager'>('tribunes');
  const [form, setForm] = useState({ name: '', text: '' });
  const [sent, setSent] = useState(false);
  const { show } = useToast();
  const t = useT();

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto overscroll-contain"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label={t('common.back')}>
          <ChevronLeft size={20} className="text-[#1a1a1a]"/>
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>{t('commu.title')}</h1>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em' }}>{t('commu.eyebrow')}</div>
        <h2 className="mt-1 max-w-md" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {t('commu.tagline')}
        </h2>
      </div>

      <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          ['tribunes', t('commu.tab.tribunes')], ['annonces', t('commu.tab.annonces')], ['qa', t('commu.tab.qa')], ['partager', t('commu.tab.share')],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-shrink-0 px-3.5 py-1.5 ${tab === k ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAFAFA] text-[#717182]'}`}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, borderRadius: 999 }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'tribunes' && (
        <section className="px-5 mt-5 space-y-3">
          {tribunes.map((t) => {
            const Icon = t.kind === 'audio' ? Mic : t.kind === 'video' ? Video : MessageSquare;
            return (
              <div key={t.id} className="border border-[#F0F0F0] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#0066FF]/10 flex items-center justify-center" style={{ borderRadius: 999 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.8rem', color: '#0066FF' }}>{t.author[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#1a1a1a' }}>{t.author}</span>
                      {t.verified && <BadgeCheck size={14} className="text-[#0066FF]"/>}
                    </div>
                    <div className="text-[#717182] flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                      <Award size={11}/> {t.badge}
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-[#FAFAFA] flex items-center gap-1">
                    <Icon size={12} className="text-[#717182]"/>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#717182', letterSpacing: '0.1em' }}>{t.kind.toUpperCase()}</span>
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.5 }}>{t.text}</p>
                {t.image && (
                  <div className="mt-3 aspect-[16/10] overflow-hidden">
                    <ImageWithFallback src={t.image} alt="" className="w-full h-full object-cover"/>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
                  <span className="inline-flex items-center gap-1"><Heart size={13} /> {t.likes}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> {t.comments}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {tab === 'annonces' && (
        <section className="px-5 mt-5 space-y-2">
          {annonces.map((a) => (
            <button key={a.id} onClick={() => show(`${a.title} · ${a.meta}`, 'info')} className="w-full p-3 bg-[#FAFAFA] flex items-center gap-3 text-left">
              <span className="px-2 py-0.5 text-white" style={{ background: a.tone, fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                {a.cat.toUpperCase()}
              </span>
              <div className="flex-1">
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{a.title}</div>
                <div className="text-[#717182] flex items-center gap-1 mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                  <MapPin size={11}/> {a.meta}
                </div>
              </div>
            </button>
          ))}
        </section>
      )}

      {tab === 'qa' && (
        <section className="px-5 mt-5 space-y-3">
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a' }}>{t('commu.questions')}</h3>
          {questions.map((q, i) => (
            <div key={i} className="p-3 border border-[#F0F0F0]">
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#1a1a1a', lineHeight: 1.4 }}>{q.q}</p>
              <div className="mt-2 flex items-center gap-3 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                <span>{q.answers} {t('commu.answers')}</span>
                {q.expert && (
                  <span className="px-2 py-0.5 bg-[#0066FF]/10 text-[#0066FF] flex items-center gap-1" style={{ fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                    <BadgeCheck size={11}/> EXPERT
                  </span>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => setTab('partager')} className="w-full mt-2 py-3 bg-[#0066FF] text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
            {t('commu.ask')}
          </button>
        </section>
      )}

      {tab === 'partager' && (
        <section className="px-5 mt-5">
          {sent ? (
            <div className="p-5 bg-[#00C853]/10 text-center">
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#00C853' }}>{t('commu.thanks')}</div>
              <p className="text-[#1a1a1a]/80 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                {t('commu.sent')}
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-3">
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a' }}>{t('commu.tell')}</h3>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('commu.firstname_ph')}
                required
                className="w-full px-3 py-3 bg-[#FAFAFA] border-0 outline-none"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
              />
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder={t('commu.story_ph')}
                required
                rows={6}
                className="w-full px-3 py-3 bg-[#FAFAFA] border-0 outline-none resize-none"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
              />
              <button type="submit" className="w-full py-3 bg-[#1a1a1a] text-white flex items-center justify-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>
                <Send size={15}/> {t('commu.send')}
              </button>
              <p className="text-[#717182] text-center" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                {t('commu.moderation')}
              </p>
            </form>
          )}
        </section>
      )}

      <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }}/>
    </motion.div>
  );
}

import { motion } from 'motion/react';
import { ChevronLeft, Calendar, Bell, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { type Opportunity } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';

interface Props {
  onBack: () => void;
  onOpenOpportunity: (o: Opportunity) => void;
}

const categoryKeys = ['all', 'bourse', 'formation', 'concours', 'financement', 'mentorat', 'incubation', 'microcredit', 'subvention', 'diaspora'] as const;
const categoryFr = ['Toutes', 'Bourse', 'Formation', 'Concours', 'Financement', 'Mentorat', 'Incubation', 'Microcrédit', 'Subvention', 'Diaspora'];

const monthOrder = ['mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function OpportunitiesView({ onBack, onOpenOpportunity }: Props) {
  const t = useT();
  const tc = useContentT();
  const [tab, setTab] = useState<'fil' | 'calendrier' | 'alertes'>('fil');
  const [cat, setCat] = useState<string>('Toutes');
  const { items: opportunities } = useLiveContent<Opportunity>('opportunity');

  const filtered = useMemo(() => {
    if (cat === 'Toutes') return opportunities;
    return opportunities.filter((o) => o.tag.toLowerCase() === cat.toLowerCase());
  }, [cat, opportunities]);

  const byMonth = useMemo(() => {
    const map: Record<string, Opportunity[]> = {};
    opportunities.forEach((o) => {
      const m = monthOrder.find((mo) => o.deadline.toLowerCase().includes(mo)) ?? 'autres';
      if (!map[m]) map[m] = [];
      map[m].push(o);
    });
    return monthOrder.filter((m) => map[m]).map((m) => ({ month: m, items: map[m] }));
  }, [opportunities]);

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
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>{t('opp.title')}</h1>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em' }}>{t('opp.eyebrow')}</div>
        <h2 className="mt-1 max-w-md" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {opportunities.length} {t('opp.count_to_grab')}
        </h2>
      </div>

      <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          ['fil', t('opp.tab.feed')], ['calendrier', t('opp.tab.calendar')], ['alertes', t('opp.tab.alerts')],
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

      {tab === 'fil' && (
        <>
          <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categoryKeys.map((k, i) => {
              const fr = categoryFr[i];
              return (
                <button
                  key={k}
                  onClick={() => setCat(fr)}
                  className={`flex-shrink-0 px-3 py-1 ${cat === fr ? 'bg-[#00C853]/15 text-[#00C853]' : 'bg-[#FAFAFA] text-[#717182]'}`}
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, borderRadius: 999 }}
                >
                  {t(`opp.cat.${k}`)}
                </button>
              );
            })}
          </div>
          <section className="px-5 mt-4 space-y-3">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpenOpportunity(o)}
                className="w-full flex gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left hover:border-[#00C853]/30 transition-colors"
              >
                <div className="w-20 h-20 overflow-hidden flex-shrink-0">
                  <ImageWithFallback src={o.image} alt={o.title} className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 text-white" style={{ background: o.color, fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                    {tc.opportunity(o.id, 'tag', o.tag).toUpperCase()}
                  </span>
                  <h3 className="line-clamp-2 mt-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                    {tc.opportunity(o.id, 'title', o.title)}
                  </h3>
                  <div className="text-[#717182] mt-1 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                    <Calendar size={11}/> {t('opp.deadline_label')} {tc.opportunity(o.id, 'deadline', o.deadline)}
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                {t('opp.empty_cat')}
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'calendrier' && (
        <section className="px-5 mt-5 space-y-5">
          {byMonth.map(({ month, items }) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-[#00C853]"/>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>{month}</h3>
                <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>· {items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((o) => (
                  <button key={o.id} onClick={() => onOpenOpportunity(o)} className="w-full flex items-center gap-3 p-3 bg-[#FAFAFA] text-left">
                    <div className="text-center" style={{ width: 44 }}>
                      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: o.color, lineHeight: 1 }}>
                        {o.deadline.match(/\d+/)?.[0]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{tc.opportunity(o.id, 'title', o.title)}</div>
                      <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{tc.opportunity(o.id, 'tag', o.tag)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'alertes' && (
        <section className="px-5 mt-5 space-y-3">
          <div className="p-4 bg-gradient-to-br from-[#00C853]/10 to-[#0066FF]/10">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-[#00C853]"/>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#1a1a1a' }}>{t('opp.alert_title')}</span>
            </div>
            <p className="text-[#1a1a1a]/80 mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', lineHeight: 1.5 }}>
              {t('opp.alert_desc')}
            </p>
          </div>
          {[t('opp.cat.bourse'), t('opp.cat.formation'), t('opp.cat.concours'), t('opp.cat.financement'), t('opp.cat.mentorat')].map((c) => (
            <Toggle key={c} label={c}/>
          ))}
        </section>
      )}

      <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }}/>
    </motion.div>
  );
}

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <button onClick={() => setOn(!on)} className="w-full flex items-center justify-between p-3 bg-[#FAFAFA]">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#717182]"/>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>{label}</span>
      </div>
      <div className={`w-10 h-6 ${on ? 'bg-[#00C853]' : 'bg-[#E5E5E5]'} relative transition-colors`} style={{ borderRadius: 999 }}>
        <div className={`absolute top-0.5 ${on ? 'left-[18px]' : 'left-0.5'} w-5 h-5 bg-white transition-all`} style={{ borderRadius: 999 }}/>
      </div>
    </button>
  );
}

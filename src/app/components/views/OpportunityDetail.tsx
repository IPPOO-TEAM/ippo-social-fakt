import { motion } from 'motion/react';
import { ChevronLeft, Calendar, MapPin, Bookmark, Share2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { AdminQuickDelete } from '../AdminQuickDelete';
import { useFavorites, useHistory } from '../../lib/storage';
import type { Opportunity } from '../../data/mock';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';

interface Props {
  opportunity: Opportunity;
  onClose: () => void;
}

export function OpportunityDetail({ opportunity: o, onClose }: Props) {
  const t = useT();
  const tc = useContentT();
  const oTitle = tc.opportunity(o.id, 'title', o.title);
  const oTag = tc.opportunity(o.id, 'tag', o.tag);
  const oDeadline = tc.opportunity(o.id, 'deadline', o.deadline);
  const { has, toggle } = useFavorites();
  const { push } = useHistory();
  const saved = has(o.id);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', motivation: '' });

  useEffect(() => {
    push({ id: o.id, kind: 'opportunity', title: o.title, image: o.image, meta: o.tag });
  }, [o.id]);

  const onShare = async () => {
    const text = `${o.title} · échéance ${o.deadline}`;
    if (navigator.share) {
      try { await navigator.share({ title: o.title, text }); } catch {}
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const criteria = [
    t('opp.criteria.1'),
    t('opp.criteria.2'),
    t('opp.criteria.3'),
    t('opp.criteria.4'),
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[60] bg-white max-w-2xl mx-auto overflow-y-auto overscroll-contain"
    >
      <div className="relative aspect-[4/3]">
        <ImageWithFallback src={o.image} alt={oTitle} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
        <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur flex items-center justify-center" aria-label={t('common.back')}>
          <ChevronLeft size={20} />
        </button>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <AdminQuickDelete resource="opportunity" id={o.id} label={`L'opportunité « ${o.title} »`} onDeleted={onClose} />
          <button onClick={onShare} className="w-10 h-10 bg-white/90 backdrop-blur flex items-center justify-center" aria-label={t('common.share')}>
            <Share2 size={18} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="inline-block px-2.5 py-1 mb-2 text-white" style={{ background: o.color, fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            {oTag.toUpperCase()}
          </span>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {oTitle}
          </h1>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-[#FAFAFA] flex items-center gap-2">
            <Calendar size={16} className="text-[#0066FF] flex-shrink-0"/>
            <div className="min-w-0">
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em' }}>{t('opp.deadline_label')}</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{oDeadline}</div>
            </div>
          </div>
          <div className="p-3 bg-[#FAFAFA] flex items-center gap-2">
            <MapPin size={16} className="text-[#0066FF] flex-shrink-0"/>
            <div className="min-w-0">
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em' }}>{t('opp.location_label')}</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{t('opp.location_national')}</div>
            </div>
          </div>
        </div>

        <h2 className="mt-6 mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
          {t('opp.description')}
        </h2>
        <p className="text-[#1a1a1a]/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {t('opp.description_body')}
        </p>

        <h2 className="mt-6 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
          {t('opp.criteria')}
        </h2>
        <ul className="space-y-2">
          {criteria.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#00C853] flex-shrink-0 mt-0.5"/>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#1a1a1a', lineHeight: 1.5 }}>{c}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex gap-2">
          <button
            onClick={() => setApplyOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white"
            style={{ background: o.color, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}
          >
            {applied ? t('opp.applied') : t('opp.apply_now')} <ExternalLink size={16} />
          </button>
          <button
            onClick={() => toggle({ id: o.id, kind: 'opportunity', title: o.title, image: o.image, meta: o.tag })}
            className={`px-4 py-3.5 ${saved ? 'bg-[#0066FF] text-white' : 'bg-[#FAFAFA] text-[#1a1a1a]'}`}
            aria-label={t('opp.save_aria')}
          >
            <Bookmark size={18} className={saved ? 'fill-white' : ''} />
          </button>
        </div>
      </div>
      <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }}/>

      {applyOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setApplyOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white p-5 max-h-[85vh] overflow-y-auto" style={{ borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)' }}>
            <div className="w-10 h-1 bg-[#E5E5E5] mx-auto mb-4 rounded-full"/>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>
              {applied ? t('opp.applied') : `${t('opp.apply_for')} · ${oTitle}`}
            </h3>
            {applied ? (
              <div className="mt-4 space-y-3">
                <p className="text-[#1a1a1a]/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {t('opp.thanks')} {form.name || t('opp.thanks_for_app')} ! {t('opp.reply_at')} {form.email}.
                </p>
                <button onClick={() => setApplyOpen(false)} className="w-full py-3 text-white" style={{ background: o.color, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                  {t('common.close')}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setApplied(true); }}
                className="mt-4 space-y-3"
              >
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('opp.fullname_ph')}
                  className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#F0F0F0]"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('opp.email_ph')}
                  className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#F0F0F0]"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
                />
                <textarea
                  required
                  rows={4}
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  placeholder={t('opp.motivation_ph')}
                  className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#F0F0F0]"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
                />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setApplyOpen(false)} className="flex-1 py-3 bg-[#FAFAFA] text-[#1a1a1a]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                    {t('opp.cancel')}
                  </button>
                  <button type="submit" className="flex-1 py-3 text-white" style={{ background: o.color, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                    {t('opp.send')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

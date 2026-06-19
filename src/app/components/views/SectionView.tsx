import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Section } from '../../data/sections';
import { articles as seedArticles, episodes as seedEpisodes, videos as seedVideos, opportunities as seedOpportunities, type Article, type Video, type Opportunity, type Episode } from '../../data/mock';
import type { PlayingTrack } from '../MiniPlayer';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useLiveContent } from '../../lib/live-content';

interface Props {
  section: Section;
  onBack: () => void;
  onOpenArticle?: (a: Article) => void;
  onOpenVideo?: (v: Video) => void;
  onPlay?: (t: PlayingTrack) => void;
  onOpenOpportunity?: (o: Opportunity) => void;
  initialRubric?: string;
}

export function SectionView({ section, onBack, onOpenArticle, onOpenVideo, onPlay, onOpenOpportunity, initialRubric }: Props) {
  const t = useT();
  const tc = useContentT();
  const [activeRubric, setActiveRubric] = useState<string>(initialRubric ?? 'Tout');
  const Icon = section.icon;
  const { items: articles } = useLiveContent<Article>('article', seedArticles);
  const { items: episodes } = useLiveContent<Episode>('episode', seedEpisodes);
  const { items: videos } = useLiveContent<Video>('video', seedVideos);
  const { items: opportunities } = useLiveContent<Opportunity>('opportunity', seedOpportunities);

  const sectionArticles = useMemo(() => {
    const base = articles.filter((a) => a.section === section.key);
    const pool = base.length ? base : articles.slice(0, 4);
    if (activeRubric === 'Tout') return pool;
    const q = activeRubric.toLowerCase();
    const tokens = q.split(/[ &']+/).filter((tk) => tk.length > 3);
    const match = pool.filter((a) => {
      const hay = `${a.title} ${a.category} ${a.location}`.toLowerCase();
      return tokens.some((tk) => hay.includes(tk));
    });
    return match.length ? match : pool;
  }, [section.key, activeRubric, articles]);

  const sectionEpisodes = useMemo(() => {
    const filtered = episodes.filter((e) => e.section === section.key);
    return filtered.length ? filtered : episodes.slice(0, 3);
  }, [section.key, episodes]);

  const sectionVideos = useMemo(() => {
    const filtered = videos.filter((v) => v.section === section.key);
    return filtered.length ? filtered : videos.slice(0, 3);
  }, [section.key, videos]);

  const sectionOpps = useMemo(() => {
    const filtered = opportunities.filter((o) => o.section === section.key);
    return filtered.length ? filtered : opportunities;
  }, [section.key, opportunities]);

  const showOpps = section.key === 'opportunities' || section.key === 'jeunesse' || sectionOpps.length > 0;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto flex flex-col overflow-y-auto"
    >
      <div className="relative text-white px-5 pt-4 pb-6 overflow-hidden" style={{ background: section.color, minHeight: 220 }}>
        <ImageWithFallback src={section.hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${section.color}66 0%, ${section.color}D9 70%, ${section.color} 100%)` }}
        />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/15 blur-3xl pointer-events-none"/>
        <div className="relative flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('common.back')}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1"/>
          <div className="w-10 h-10 bg-white/20 backdrop-blur flex items-center justify-center">
            <Icon size={18} />
          </div>
        </div>
        <div className="relative mt-5">
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            {section.label}
          </h1>
          <p className="opacity-90 mt-1 max-w-md" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
            {section.description}
          </p>
        </div>
      </div>

      {section.rubrics.length > 0 && (
        <div className="px-5 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['Tout', ...section.rubrics.map((r) => r.label)].map((label) => {
            const active = activeRubric === label;
            return (
              <button
                key={label}
                onClick={() => setActiveRubric(label)}
                className={`flex-shrink-0 px-3.5 py-1.5 transition-all ${
                  active ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAFAFA] text-[#717182]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, borderRadius: 999 }}
              >
                {label === 'Tout' ? t('section.all') : label}
              </button>
            );
          })}
        </div>
      )}

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('section.featured')}
          </h2>
          <span className="text-[#717182] flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
            {sectionArticles.length} {t('section.articles')} <ChevronRight size={12} />
          </span>
        </div>
        <div className="space-y-3">
          {sectionArticles.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpenArticle?.(a)}
              className="w-full flex gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left hover:border-[#0066FF]/30 transition-colors"
            >
              <div className="w-20 h-20 overflow-hidden flex-shrink-0">
                <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 text-white" style={{ background: a.color, fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {tc.article(a.id, 'category', a.category).toUpperCase()}
                </span>
                <h3 className="line-clamp-2 mt-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                  {tc.article(a.id, 'title', a.title)}
                </h3>
                <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  {tc.article(a.id, 'date', a.date)} · {tc.article(a.id, 'readTime', a.readTime)} · {a.location}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {sectionEpisodes.length > 0 && (
        <section className="px-5 mt-6">
          <h2 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('section.to_listen')}
          </h2>
          <div className="space-y-2">
            {sectionEpisodes.map((e) => (
              <button
                key={e.id}
                onClick={() => onPlay?.(e)}
                className="w-full flex items-center gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left hover:shadow-sm transition"
              >
                <div className="relative w-16 h-16 overflow-hidden flex-shrink-0">
                  <ImageWithFallback src={e.image} alt={e.title} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play size={14} className="fill-white text-white ml-0.5"/>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: e.color, letterSpacing: '0.1em' }}>
                    {tc.episode(e.id, 'show', e.show).toUpperCase()}
                  </div>
                  <h3 className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                    {tc.episode(e.id, 'title', e.title)}
                  </h3>
                  <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                    {tc.episode(e.id, 'duration', e.duration)} · {e.plays} {t('section.plays')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {sectionVideos.length > 0 && (
        <section className="px-5 mt-6">
          <h2 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('section.to_watch')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {sectionVideos.map((v) => (
              <button
                key={v.id}
                onClick={() => onOpenVideo?.(v)}
                className="text-left overflow-hidden bg-white border border-[#F0F0F0]"
              >
                <div className="relative aspect-video">
                  <ImageWithFallback src={v.image} alt={v.title} className="w-full h-full object-cover"/>
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.08em' }}>
                    {tc.video(v.id, 'type', v.type).toUpperCase()}
                  </span>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600 }}>
                    {v.duration}
                  </span>
                </div>
                <div className="p-2.5">
                  <h3 className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                    {tc.video(v.id, 'title', v.title)}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {section.rubrics.length > 0 && (
        <section className="px-5 mt-6">
          <h2 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('section.all_topics')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {section.rubrics.map((r) => (
              <button
                key={r.label}
                onClick={() => setActiveRubric(r.label)}
                className="text-left p-3 bg-[#FAFAFA] hover:bg-[#F0F0F0] transition-colors flex items-center justify-between gap-2"
                style={{ borderRadius: 'var(--r-md)'}}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {r.label}
                </span>
                <ChevronRight size={14} className="text-[#717182] flex-shrink-0"/>
              </button>
            ))}
          </div>
        </section>
      )}

      {showOpps && (
        <section className="px-5 mt-6">
          <h2 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('section.related_opps')}
          </h2>
          <div className="space-y-2">
            {sectionOpps.map((o) => (
              <button key={o.id} onClick={() => onOpenOpportunity?.(o)} className="w-full p-3 bg-white border border-[#F0F0F0] flex items-center gap-3 text-left hover:border-[#0066FF]/30 transition-colors">
                <div className="w-12 h-12 overflow-hidden flex-shrink-0">
                  <ImageWithFallback src={o.image} alt={o.title} className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{tc.opportunity(o.id, 'title', o.title)}</div>
                  <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                    <span className="inline-block px-1.5 py-0.5 mr-1.5 text-white" style={{ background: o.color, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em' }}>{tc.opportunity(o.id, 'tag', o.tag).toUpperCase()}</span>
                    {t('section.deadline')} {tc.opportunity(o.id, 'deadline', o.deadline)}
                  </div>
                </div>
                <Sparkles size={16} className="text-[#717182]"/>
              </button>
            ))}
          </div>
        </section>
      )}

      <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }}/>
    </motion.div>
  );
}

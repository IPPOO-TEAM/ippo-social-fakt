import { ImageWithFallback } from '../figma/ImageWithFallback';
import { optimizedUnsplash } from '../../lib/images';
import { Play, Radio, ArrowRight, TrendingUp, TrendingDown, Bookmark, Headphones, Mic, Clock } from 'lucide-react';
import {
  formatFcfa, priceTrendPct,
  type Article, type Episode, type Opportunity, type PriceItem,
} from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import type { PlayingTrack } from '../MiniPlayer';
import { SectionKey } from '../../data/sections';
import { useResolvedSections } from '../../lib/admin-overrides';
import { useState } from 'react';
import { useUser } from '../../lib/user';
import { ArticleRowSkeleton, FeaturedCardSkeleton, Skeleton } from '../Skeleton';
import { AdCarousel } from '../AdCarousel';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useTheme } from '../../lib/theme';
import heroLight from '../../../imports/social_fact_1.png';
import heroDark from '../../../imports/social_fact_2.png';

interface Props {
  onPlay: (t: PlayingTrack) => void;
  onOpenArticle: (a: Article) => void;
  onOpenSection?: (k: SectionKey) => void;
  onOpenOpportunity?: (o: Opportunity) => void;
}

const topTabs: { key: 'all' | SectionKey; tKey: string }[] = [
  { key: 'all', tKey: 'tab.foryou' },
  { key: 'actu', tKey: 'tab.actu' },
  { key: 'informel', tKey: 'tab.informel' },
  { key: 'opportunities', tKey: 'tab.opportunities' },
  { key: 'sante', tKey: 'tab.sante' },
  { key: 'consommation', tKey: 'tab.consommation' },
  { key: 'societe', tKey: 'tab.societe' },
  { key: 'jeunesse', tKey: 'tab.jeunesse' },
];

export function HomeView({ onPlay, onOpenArticle, onOpenSection, onOpenOpportunity }: Props) {
  const [tab, setTab] = useState<'all' | SectionKey>('all');
  const sections = useResolvedSections().filter((s) => !s.hidden);
  const [loading] = useState(false);
  const { user } = useUser();
  const { isDark } = useTheme();
  const t = useT();
  const tc = useContentT();
  const { items: articles } = useLiveContent<Article>('article');
  const { items: episodes } = useLiveContent<Episode>('episode');
  const { items: opportunities } = useLiveContent<Opportunity>('opportunity');
  const { items: prices } = useLiveContent<PriceItem>('price');
  const hero = articles[0];
  const todayEpisode = episodes[0];

  const feed = tab === 'all' ? articles : articles.filter((a) => a.section === tab);
  const list = feed.length ? feed : articles;
  const featured = list[0];
  const rest = list.slice(1);

  if (loading) {
    return (
      <div className="pb-6 px-5 pt-5 space-y-4">
        <Skeleton className="h-3 w-32"/>
        <Skeleton className="h-7 w-3/4"/>
        <Skeleton className="h-3 w-1/2"/>
        <div className="flex gap-2 overflow-hidden mt-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 flex-shrink-0"/>)}
        </div>
        <FeaturedCardSkeleton/>
        <ArticleRowSkeleton/>
        <ArticleRowSkeleton/>
        <ArticleRowSkeleton/>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Greeting / date */}
      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          {t('home.hello')} <span className="text-[#0066FF]">{user.firstName || 'à vous'}</span>.
        </h1>
        <p className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}>
          {t('home.subtitle')}
        </p>
      </div>

      <AdCarousel/>

      {/* Pill tabs */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md mt-4">
        <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
          {topTabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className="flex-shrink-0 px-3.5 py-1.5 transition-all"
                style={{
                  background: active ? '#1a1a1a' : '#F4F4F6',
                  color: active ? 'white' : '#717182',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 500,
                  borderRadius: 999,
                }}
              >
                {t(item.tKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured — magazine card */}
      {featured && (
      <section className="px-5 mt-1">
        <button onClick={() => onOpenArticle(featured)} className="block w-full text-left relative overflow-hidden aspect-[4/5]" style={{ borderRadius: 'var(--r-lg)' }}>
          <ImageWithFallback src={optimizedUnsplash(featured.image, 1200, 75)} alt={featured.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)' }}/>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <span className="inline-block px-2.5 py-1 mb-3" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', borderRadius: 999 }}>
              {tc.article(featured.id, 'category', featured.category).toUpperCase()} · {featured.location.toUpperCase()}
            </span>
            <h2 className="text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {tc.article(featured.id, 'title', featured.title)}
            </h2>
            <div className="text-white/75 mt-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
              {tc.article(featured.id, 'date', featured.date)} · {tc.article(featured.id, 'readTime', featured.readTime)}
            </div>
          </div>
        </button>
      </section>
      )}

      <section className="mt-5">
        <div className="w-full overflow-hidden bg-[#F4F4F6]">
          <img
            src={isDark ? heroDark : heroLight}
            alt="IPPOO Social-Fact"
            className="w-full h-auto block select-none"
            draggable={false}
          />
        </div>
      </section>

      {/* Live — immersive broadcast card */}
      {hero && (
      <section className="px-5 mt-5">
        <button
          onClick={() => onPlay({ id: 'live', title: 'Matinale Communautaire', show: 'Direct radio', image: hero.image, color: '#0066FF' })}
          className="relative w-full overflow-hidden text-left group"
          style={{ borderRadius: 'var(--r-lg)' }}
        >
          <div className="absolute inset-0">
            <ImageWithFallback src={optimizedUnsplash(hero.image, 1000, 70)} alt="" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" loading="lazy" decoding="async"/>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,10,31,0.92) 0%, rgba(15,10,31,0.78) 50%, rgba(255,59,48,0.55) 100%)' }}/>
          </div>

          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,59,48,0.45) 0%, transparent 70%)' }}/>
          <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.35) 0%, transparent 70%)' }}/>

          <div className="relative px-5 pt-4 pb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75 animate-ping"/>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-[#FF3B30]"/>
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.18em' }}>EN DIRECT</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', borderRadius: 999 }}>
                <Radio size={11} className="text-white"/>
                <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.66rem', fontWeight: 700 }}>2 412</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-white/65" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  IPPOO Radio · Émission
                </div>
                <h3 className="text-white mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  Matinale Communautaire
                </h3>
                <div className="flex items-center gap-1 mt-1.5" aria-hidden>
                  {[3, 7, 5, 9, 4, 8, 6, 10, 5, 7, 4, 8, 6, 9, 3, 7].map((h, i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-white/70"
                      style={{
                        height: `${h * 1.5}px`,
                        animation: `wave 1.${(i % 6) + 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.06}s`,
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="relative w-14 h-14 flex-shrink-0">
                <div className="absolute inset-0 bg-white/20 animate-ping" style={{ borderRadius: 999, animationDuration: '2s' }}/>
                <div className="relative w-14 h-14 bg-white text-[#0F0A1F] flex items-center justify-center shadow-2xl" style={{ borderRadius: 999 }}>
                  <Play size={20} className="fill-[#0F0A1F] ml-0.5"/>
                </div>
              </div>
            </div>
          </div>
        </button>
        <style>{`@keyframes wave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }`}</style>
      </section>
      )}

      {/* Section title */}
      <div className="px-5 mt-7 flex items-end justify-between">
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          {t('home.read')}
        </h3>
        <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
          {rest.length} {t('search.articles').toLowerCase()}
        </span>
      </div>

      {/* Article feed — modern card rows */}
      <section className="mt-3 px-5 space-y-3">
        {rest.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpenArticle(a)}
              className="w-full text-left p-2.5 flex gap-3 bg-white hover:bg-[#FAFAFA] transition-colors"
              style={{ borderRadius: 'var(--r-md)' }}
            >
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: a.color, letterSpacing: '0.1em' }}>
                  {tc.article(a.id, 'category', a.category).toUpperCase()}
                </div>
                <div className="line-clamp-3 my-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.98rem', color: '#1a1a1a', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {tc.article(a.id, 'title', a.title)}
                </div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                  {tc.article(a.id, 'date', a.date)} · {tc.article(a.id, 'readTime', a.readTime)}
                </div>
              </div>
              <div className="w-24 h-24 overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-sm)' }}>
                <ImageWithFallback src={optimizedUnsplash(a.image, 480, 65)} alt={a.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
              </div>
            </button>
          ))}
      </section>

      {/* Quick access — minimal pill grid */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('home.explore')}
          </h3>
          <button onClick={() => onOpenSection?.('services')} className="flex items-center gap-1 text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
            {t('common.see_all')} <ArrowRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {sections
            .filter((s) => !['home', 'actu', 'podcast', 'videos', 'search', 'profile'].includes(s.key))
            .slice(0, 8)
            .map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => onOpenSection?.(s.key)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 flex items-center justify-center" style={{ background: `${s.color}14`, color: s.color, borderRadius: 'var(--r-md)' }}>
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="text-center" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>
                    {s.short}
                  </span>
                </button>
              );
            })}
        </div>
      </section>

      {/* Podcasts — enriched */}
      <section className="mt-7">
        <div className="px-5 flex items-end justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em' }}>
              <Headphones size={11}/> PODCASTS
            </div>
            <h3 className="mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              {t('home.episode_today')}
            </h3>
          </div>
          <button onClick={() => onOpenSection?.('podcast')} className="flex items-center gap-1 text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
            {t('common.see_all')} <ArrowRight size={13}/>
          </button>
        </div>

        {/* Featured episode — magazine-style */}
        {todayEpisode && (
        <div className="px-5">
          <div
            onClick={() => onPlay(todayEpisode)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(todayEpisode); } }}
            className="relative w-full overflow-hidden text-left group cursor-pointer"
            style={{ borderRadius: 'var(--r-lg)' }}
          >
            <div className="relative aspect-[16/10]">
              <ImageWithFallback src={optimizedUnsplash(todayEpisode.image, 800, 70)} alt={todayEpisode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async"/>
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, ${todayEpisode.color}DD 100%)` }}/>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', borderRadius: 999 }}>
                <Mic size={11} className="text-white"/>
                <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em' }}>
                  {tc.episode(todayEpisode.id, 'show', todayEpisode.show).toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); }}
                aria-label="Sauvegarder"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', borderRadius: 999 }}
              >
                <Bookmark size={14} className="text-white"/>
              </button>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h4 className="text-white line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
                  {tc.episode(todayEpisode.id, 'title', todayEpisode.title)}
                </h4>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-white/85" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600 }}>
                    <span className="flex items-center gap-1"><Clock size={11}/> {tc.episode(todayEpisode.id, 'duration', todayEpisode.duration)}</span>
                    <span className="flex items-center gap-1"><Headphones size={11}/> {todayEpisode.plays}</span>
                  </div>
                  <div className="w-11 h-11 bg-white text-[#1a1a1a] flex items-center justify-center shadow-lg" style={{ borderRadius: 999 }}>
                    <Play size={16} className="fill-[#1a1a1a] ml-0.5"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Up next — horizontal scroll */}
        <div className="mt-4 px-5 flex items-center justify-between">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            À écouter ensuite
          </span>
        </div>
        <div className="mt-2 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {episodes.slice(1, 6).map((ep) => (
            <button
              key={ep.id}
              onClick={() => onPlay(ep)}
              className="flex-shrink-0 w-44 text-left group"
            >
              <div className="relative w-44 h-44 overflow-hidden" style={{ borderRadius: 'var(--r-md)' }}>
                <ImageWithFallback src={optimizedUnsplash(ep.image, 480, 65)} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async"/>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)' }}/>
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                  <span className="text-white truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {tc.episode(ep.id, 'show', ep.show)}
                  </span>
                  <div className="w-8 h-8 bg-white text-[#1a1a1a] flex items-center justify-center flex-shrink-0 shadow-md" style={{ borderRadius: 999 }}>
                    <Play size={12} className="fill-[#1a1a1a] ml-0.5"/>
                  </div>
                </div>
              </div>
              <div className="mt-2 line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.84rem', color: '#1a1a1a', lineHeight: 1.25 }}>
                {tc.episode(ep.id, 'title', ep.title)}
              </div>
              <div className="text-[#717182] mt-0.5 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                <span className="flex items-center gap-0.5"><Clock size={10}/> {tc.episode(ep.id, 'duration', ep.duration)}</span>
                <span>·</span>
                <span>{ep.plays}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Show pills */}
        <div className="mt-2 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
          {Array.from(new Set(episodes.map((ep) => ep.show))).slice(0, 6).map((show) => {
            const ep = episodes.find((e) => e.show === show)!;
            return (
              <button
                key={show}
                onClick={() => onOpenSection?.('podcast')}
                className="flex-shrink-0 flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-[#F0F0F0] hover:border-[#0066FF]/40 transition-colors"
                style={{ borderRadius: 999 }}
              >
                <div className="w-6 h-6 overflow-hidden flex-shrink-0" style={{ borderRadius: 999 }}>
                  <ImageWithFallback src={optimizedUnsplash(ep.image, 200, 60)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                </div>
                <span className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {show}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Opportunities */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('home.opportunities')}
          </h3>
          <button onClick={() => onOpenSection?.('opportunities')} className="flex items-center gap-1 text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
            {t('common.see_all')} <ArrowRight size={13} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
          {opportunities.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpenOpportunity?.(o)}
              className="flex-shrink-0 w-56 text-left bg-white border border-[#F0F0F0] overflow-hidden"
              style={{ borderRadius: 'var(--r-sm)' }}
            >
              <div className="aspect-[16/9] overflow-hidden">
                <ImageWithFallback src={optimizedUnsplash(o.image, 480, 65)} alt={o.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
              </div>
              <div className="p-3">
                <span className="inline-block px-2 py-0.5 text-white mb-2" style={{ background: o.color, fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {tc.opportunity(o.id, 'tag', o.tag).toUpperCase()}
                </span>
                <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                  {tc.opportunity(o.id, 'title', o.title)}
                </div>
                <div className="text-[#717182] mt-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  {t('home.before')} {tc.opportunity(o.id, 'deadline', o.deadline)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Prices */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
            {t('home.consommation')}
          </h3>
          <button onClick={() => onOpenSection?.('consommation')} className="flex items-center gap-1 text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
            {t('common.see_all')} <ArrowRight size={13} />
          </button>
        </div>
        <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
          {prices.slice(0, 4).map((p) => {
            const trend = priceTrendPct(p);
            return (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', fontWeight: 500, color: '#1a1a1a' }}>{p.product}</div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{formatFcfa(p.price)}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 ${trend < 0 ? 'bg-[#E5F8EC] text-[#00C853]' : 'bg-[#FDE8E6] text-[#FF3B30]'}`}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, borderRadius: 999 }}
                  >
                    {trend < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

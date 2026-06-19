import { Search, TrendingUp, X, Mic, Newspaper, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { articles as seedArticles, episodes as seedEpisodes, videos as seedVideos, type Article, type Episode, type Video as VideoT } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import type { PlayingTrack } from '../MiniPlayer';
import { EmptyState } from '../EmptyState';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useRecentSearches } from '../../lib/recent-searches';

const trends = ['Bourse INP-HB', 'Cacao', 'Élections locales', 'Diaspora', 'ZLECAf', 'Femmes entrepreneures', 'Akpakpa', 'Panafricanisme'];

interface Props {
  onOpenArticle?: (a: Article) => void;
  onOpenVideo?: (v: VideoT) => void;
  onPlay?: (t: PlayingTrack) => void;
}

export function SearchView({ onOpenArticle, onOpenVideo, onPlay }: Props = {}) {
  const t = useT();
  const tc = useContentT();
  const filters = [
    { key: 'all', label: t('common.all'), icon: Search },
    { key: 'article', label: t('search.articles'), icon: Newspaper },
    { key: 'podcast', label: t('title.podcast'), icon: Mic },
    { key: 'video', label: t('title.videos'), icon: Video },
  ];
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const { items: recents, push: pushRecent, remove: removeRecent } = useRecentSearches();
  const { items: articles } = useLiveContent<Article>('article', seedArticles);
  const { items: episodes } = useLiveContent<Episode>('episode', seedEpisodes);
  const { items: videos } = useLiveContent<VideoT>('video', seedVideos);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => pushRecent(query), 800);
    return () => clearTimeout(t);
  }, [query, pushRecent]);

  const q = query.trim().toLowerCase();
  const matchesArticles = q ? articles.filter((a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)) : [];
  const matchesEpisodes = q ? episodes.filter((e) => e.title.toLowerCase().includes(q) || e.show.toLowerCase().includes(q)) : [];
  const matchesVideos = q ? videos.filter((v) => v.title.toLowerCase().includes(q) || v.type.toLowerCase().includes(q)) : [];

  const showArticles = active === 'all' || active === 'article';
  const showEpisodes = active === 'all' || active === 'podcast';
  const showVideos = active === 'all' || active === 'video';

  const totalMatches =
    (showArticles ? matchesArticles.length : 0) +
    (showEpisodes ? matchesEpisodes.length : 0) +
    (showVideos ? matchesVideos.length : 0);

  return (
    <div className="pb-6">
      <div className="px-5 pt-5">
        <p className="text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em' }}>{t('search.eyebrow')}</p>
        <h1 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.9rem', color: '#1a1a1a', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {t('search.title')}
        </h1>

        <div className="mt-4 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717182]"/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.input_placeholder')}
            className="w-full pl-11 pr-11 py-3.5 bg-[#FAFAFA] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#E5E5E5] flex items-center justify-center" aria-label={t('common.clear')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {filters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 transition-all ${
                active === key ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAFAFA] text-[#717182]'
              }`}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600, borderRadius: 999 }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {q ? (
        <section className="px-5 mt-6">
          <div className="text-[#717182] mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
            {totalMatches} {t('search.results')}{totalMatches > 1 ? 's' : ''} {t('search.results_for')} « {query} »
          </div>
          {showArticles && matchesArticles.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{t('search.articles')}</h4>
              <div className="space-y-2">
                {matchesArticles.map((a) => (
                  <button key={a.id} onClick={() => onOpenArticle?.(a)} className="w-full flex gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left">
                    <div className="w-14 h-14 overflow-hidden flex-shrink-0">
                      <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{tc.article(a.id, 'title', a.title)}</div>
                      <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{tc.article(a.id, 'category', a.category)} · {a.location}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {showEpisodes && matchesEpisodes.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{t('title.podcast')}</h4>
              <div className="space-y-2">
                {matchesEpisodes.map((e) => (
                  <button key={e.id} onClick={() => onPlay?.(e)} className="w-full flex gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left">
                    <div className="w-14 h-14 overflow-hidden flex-shrink-0">
                      <ImageWithFallback src={e.image} alt={e.title} className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{tc.episode(e.id, 'title', e.title)}</div>
                      <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{tc.episode(e.id, 'show', e.show)} · {tc.episode(e.id, 'duration', e.duration)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {showVideos && matchesVideos.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{t('title.videos')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {matchesVideos.map((v) => (
                  <button key={v.id} onClick={() => onOpenVideo?.(v)} className="text-left bg-white border border-[#F0F0F0] overflow-hidden">
                    <div className="aspect-video">
                      <ImageWithFallback src={v.image} alt={v.title} className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-2"><div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#1a1a1a' }}>{tc.video(v.id, 'title', v.title)}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {totalMatches === 0 && (
            <EmptyState
              icon={Search}
              title={t('search.empty')}
              description={t('search.empty_desc')}
            />
          )}
        </section>
      ) : (
        <>
          <section className="px-5 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-[#0066FF]"/>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
                {t('search.trends')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trends.map((t) => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="px-3.5 py-1.5 bg-white border border-[#F0F0F0] hover:border-[#0066FF] hover:text-[#0066FF] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 500, borderRadius: 999 }}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {recents.length > 0 && (
            <section className="px-5 mt-7">
              <h3 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
                {t('search.recent')}
              </h3>
              <div className="space-y-1">
                {recents.map((r) => (
                  <div key={r} className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-[#FAFAFA]">
                    <button onClick={() => setQuery(r)} className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-8 h-8 bg-[#FAFAFA] flex items-center justify-center">
                        <Search size={14} className="text-[#717182]"/>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#1a1a1a' }}>{r}</span>
                    </button>
                    <button onClick={() => removeRecent(r)} aria-label={t('common.delete')} className="p-1">
                      <X size={15} className="text-[#717182]"/>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

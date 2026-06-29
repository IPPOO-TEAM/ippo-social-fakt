import { ImageWithFallback } from '../figma/ImageWithFallback';
import { optimizedUnsplash } from '../../lib/images';
import { Play, Download, Bookmark, History, Headphones, X } from 'lucide-react';
import { type Episode } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import type { PlayingTrack } from '../MiniPlayer';
import { useFavorites } from '../../lib/storage';
import { useState, useMemo } from 'react';
import { tap } from '../../lib/haptic';
import { useToast } from '../Toast';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';

interface Props { onPlay: (t: PlayingTrack) => void; }

const showMeta = [
 { name: 'Voix d\'Afrique', host: 'Aïcha Diallo', episodes: 24, color: '#0066FF' },
 { name: 'Économie Locale', host: 'Mamadou Traoré', episodes: 18, color: '#FF8A00' },
 { name: 'Terrain', host: 'Fatou Koné', episodes: 12, color: '#00C853' },
];

export function PodcastView({ onPlay }: Props) {
 const { has, toggle } = useFavorites();
 const [showFilter, setShowFilter] = useState<string | null>(null);
 const { show: toast } = useToast();
 const t = useT();
 const tc = useContentT();
 const { items: episodes } = useLiveContent<Episode>('episode');
 const shows = showMeta.map((s, i) => ({ ...s, image: episodes[i]?.image ?? '' }));
 const filteredEpisodes = useMemo(
   () => (showFilter ? episodes.filter((e) => e.show === showFilter) : episodes),
   [showFilter, episodes]
 );
 const onDownload = (id: string, title: string) => {
 try { localStorage.setItem(`ippoo:downloaded:${id}`, '1'); } catch {}
 toast(`«${title}» ${t('podcast.downloaded')}`, 'success');
 };
 return (
 <div className="pb-6">
 <div className="px-5 pt-5" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
 <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
 {t('title.podcast')}
 </div>
 <h1 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
 Des voix d'ici, <span className="text-[#0066FF]">partout</span>.
 </h1>
 </div>

 {/* Reprendre l'écoute */}
 {episodes[1] && (
 <section className="px-5 mt-5">
 <div className="flex items-center gap-2 mb-3">
 <History size={14} className="text-[#0066FF]"/>
 <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#0066FF', letterSpacing: '0.15em' }}>{t('podcast.resume')}</span>
 </div>
 <button
 onClick={() => onPlay(episodes[1])}
 className="w-full p-3 text-left flex items-center gap-3 bg-white border border-[#F0F0F0] hover:border-[#0066FF]/40 transition-colors"
 >
 <div className="w-14 h-14 overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-xs)' }}>
 <ImageWithFallback src={optimizedUnsplash(episodes[1].image, 800, 70)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async"/>
 </div>
 <div className="flex-1 min-w-0">
 <div className="line-clamp-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>
 {tc.episode(episodes[1].id, 'title', episodes[1].title)}
 </div>
 <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 7:24 / {tc.episode(episodes[1].id, 'duration', episodes[1].duration)}
 </div>
 <div className="mt-2 h-1 bg-[#F0F0F0] overflow-hidden">
 <div className="h-full w-1/3 bg-[#0066FF]"/>
 </div>
 </div>
 <div className="w-10 h-10 bg-[#0066FF] text-white flex items-center justify-center flex-shrink-0">
 <Play size={14} className="fill-white ml-0.5"/>
 </div>
 </button>
 </section>
 )}

 {/* Émissions */}
 <section className="mt-6">
 <h3 className="px-5 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>
 {t('podcast.popular')}
 </h3>
 <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
 {shows.map((s) => {
 const active = showFilter === s.name;
 return (
 <button
   key={s.name}
   onClick={() => { tap(); setShowFilter(active ? null : s.name); }}
   className="flex-shrink-0 w-44 text-left transition-all hover:-translate-y-0.5"
 >
 <div
   className={`aspect-square overflow-hidden mb-2.5 relative transition-all ${active ? 'ring-2 ring-[#0066FF]' : ''}`}
   style={{ borderRadius: 'var(--r-md)', boxShadow: '0 8px 24px -16px rgba(0,0,0,0.35)' }}
 >
 <ImageWithFallback src={optimizedUnsplash(s.image, 240, 60)} alt={s.name} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
 <div className="absolute inset-0 bg-black/35"/>
 <div className="absolute bottom-2 left-2 right-2">
 <span className="px-2 py-0.5 bg-white/20 backdrop-blur text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700 }}>
 {s.episodes} {t('podcast.episodes')}
 </span>
 </div>
 </div>
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: active ? '#0066FF' : '#1a1a1a' }}>{s.name}</div>
 <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>par {s.host}</div>
 </button>
 );
 })}
 </div>
 </section>

 {/* Écouter maintenant */}
 <section className="px-5 mt-6">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <Headphones size={16} className="text-[#0066FF]"/>
 <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>
 {t('podcast.listen_now')}
 </h3>
 </div>
 {showFilter && (
 <button
   onClick={() => { tap(); setShowFilter(null); }}
   className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E5EFFF] text-[#0066FF]"
   style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
 >
 {showFilter} <X size={12} strokeWidth={2.5}/>
 </button>
 )}
 </div>
 <div className="space-y-3">
 {filteredEpisodes.length === 0 && (
 <div className="text-[#717182] py-6 text-center" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
 {t('podcast.empty')}.
 </div>
 )}
 {filteredEpisodes.map((e) => (
 <div key={e.id} className="bg-white border border-[#F0F0F0] p-3 flex items-center gap-3">
 <button
 onClick={() => onPlay(e)}
 className="relative w-16 h-16 overflow-hidden flex-shrink-0"
 >
 <ImageWithFallback src={optimizedUnsplash(e.image, 240, 60)} alt={e.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
 <div className="w-9 h-9 bg-white flex items-center justify-center">
 <Play size={14} className="fill-[#0066FF] ml-0.5" style={{ color: '#0066FF' }} />
 </div>
 </div>
 </button>
 <div className="flex-1 min-w-0">
 <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.3 }}>
 {tc.episode(e.id, 'title', e.title)}
 </div>
 <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
 {tc.episode(e.id, 'show', e.show)} · {tc.episode(e.id, 'duration', e.duration)}
 </div>
 </div>
 <div className="flex flex-col gap-1.5 flex-shrink-0">
 <button onClick={() => onDownload(e.id, e.title)} className="w-8 h-8 hover:bg-[#FAFAFA] flex items-center justify-center" aria-label="Télécharger">
 <Download size={15} className="text-[#717182]"/>
 </button>
 <button
 onClick={() => toggle({ id: e.id, kind: 'episode', title: e.title, image: e.image, meta: e.show })}
 className="w-8 h-8 hover:bg-[#FAFAFA] flex items-center justify-center"
 aria-label="Favori"
 >
 <Bookmark size={15} className={has(e.id) ? 'fill-[#0066FF] text-[#0066FF]' : 'text-[#717182]'}/>
 </button>
 </div>
 </div>
 ))}
 </div>
 </section>
 </div>
 );
}

import { motion } from 'motion/react';
import { ChevronLeft, BookOpen, Mic, Video, ChevronRight, Share2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { articles as seedArticles, episodes as seedEpisodes, videos as seedVideos, type Article, type Episode, type Video as VideoT } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import type { PlayingTrack } from '../MiniPlayer';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useSubscription } from '../../lib/subscription';
import { useNavigate } from 'react-router';
import { Paywall } from '../Paywall';

export interface Dossier {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  premium?: boolean;
}

interface Props {
  dossier: Dossier;
  onClose: () => void;
  onOpenArticle?: (a: Article) => void;
  onOpenVideo?: (v: VideoT) => void;
  onPlay?: (t: PlayingTrack) => void;
}

export function DossierDetail({ dossier, onClose, onOpenArticle, onOpenVideo, onPlay }: Props) {
  const t = useT();
  const tc = useContentT();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const locked = !!dossier.premium && !isPremium;
  const { items: articles } = useLiveContent<Article>('article', seedArticles);
  const { items: episodes } = useLiveContent<Episode>('episode', seedEpisodes);
  const { items: videos } = useLiveContent<VideoT>('video', seedVideos);
  const dossierArticles = articles.slice(0, 6);
  const dossierEpisodes = episodes.slice(0, 4);
  const dossierVideos = videos.slice(0, 3);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[60] bg-white max-w-2xl mx-auto overflow-y-auto overscroll-contain"
    >
      <div className="relative aspect-[16/10]">
        <ImageWithFallback src={dossier.image} alt={dossier.title} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/55"/>
        <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur flex items-center justify-center" aria-label={t('common.back')}>
          <ChevronLeft size={20} />
        </button>
        <button onClick={async () => {
          const text = `Dossier · ${dossier.title} · IPPOO`;
          if (navigator.share) { try { await navigator.share({ title: dossier.title, text }); } catch {} }
          else if (navigator.clipboard) { navigator.clipboard.writeText(text); }
        }} className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur flex items-center justify-center" aria-label={t('common.share')}>
          <Share2 size={18} />
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="inline-block px-2.5 py-1 mb-2" style={{ background: dossier.color, fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            {t('dossier.label')}
          </span>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.65rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {dossier.title}
          </h1>
          <p className="opacity-90 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
            {dossier.subtitle}
          </p>
        </div>
      </div>

      {locked && (
        <Paywall
          title="Dossier réservé aux Premium"
          message="Accédez à l'enquête complète et à tous nos dossiers."
          onUpgrade={() => navigate('/pricing')}
        />
      )}
      {!locked && (
      <div className="px-5 py-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: BookOpen, label: t('dossier.articles'), value: dossierArticles.length, color: '#0066FF' },
            { icon: Mic, label: t('dossier.podcasts'), value: dossierEpisodes.length, color: '#FF3FA4' },
            { icon: Video, label: t('dossier.videos'), value: dossierVideos.length, color: '#FF8A00' },
          ].map((s) => (
            <div key={s.label} className="bg-[#FAFAFA] p-3 text-center">
              <s.icon size={18} className="mx-auto mb-1" style={{ color: s.color }}/>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>{s.value}</div>
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-6 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
          {t('dossier.articles_h')}
        </h2>
        <div className="space-y-3">
          {dossierArticles.map((a) => (
            <button key={a.id} onClick={() => onOpenArticle?.(a)} className="w-full flex gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left">
              <div className="w-20 h-20 overflow-hidden flex-shrink-0">
                <ImageWithFallback src={a.image} alt={a.title} className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: a.color, letterSpacing: '0.1em' }}>
                  {tc.article(a.id, 'category', a.category).toUpperCase()}
                </div>
                <h3 className="line-clamp-2 my-0.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                  {tc.article(a.id, 'title', a.title)}
                </h3>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  {tc.article(a.id, 'date', a.date)} · {tc.article(a.id, 'readTime', a.readTime)}
                </div>
              </div>
              <ChevronRight size={16} className="text-[#717182] self-center flex-shrink-0"/>
            </button>
          ))}
        </div>

        <h2 className="mt-6 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
          {t('dossier.podcasts_h')}
        </h2>
        <div className="space-y-2">
          {dossierEpisodes.map((e) => (
            <button key={e.id} onClick={() => onPlay?.(e)} className="w-full flex items-center gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left">
              <div className="w-14 h-14 overflow-hidden flex-shrink-0">
                <ImageWithFallback src={e.image} alt={e.title} className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                  {tc.episode(e.id, 'title', e.title)}
                </h3>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{tc.episode(e.id, 'show', e.show)} · {tc.episode(e.id, 'duration', e.duration)}</div>
              </div>
            </button>
          ))}
        </div>

        <h2 className="mt-6 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
          {t('dossier.videos_h')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {dossierVideos.map((v) => (
            <button key={v.id} onClick={() => onOpenVideo?.(v)} className="text-left overflow-hidden bg-white border border-[#F0F0F0]">
              <div className="relative aspect-video">
                <ImageWithFallback src={v.image} alt={v.title} className="w-full h-full object-cover"/>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600 }}>{v.duration}</span>
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#1a1a1a', lineHeight: 1.3 }}>{tc.video(v.id, 'title', v.title)}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}
      <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }}/>
    </motion.div>
  );
}

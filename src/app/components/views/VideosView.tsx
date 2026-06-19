import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Play, Eye, Zap, ArrowRight } from 'lucide-react';
import { videos as seedVideos, shorts } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useViewCounts } from '../../lib/storage';

function formatViews(n: number | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const filters = ['Tout', 'Capsules', 'Reportages', 'Portraits', 'Extraits'] as const;

interface Props { onOpenVideo: (v: typeof seedVideos[number]) => void; }

export function VideosView({ onOpenVideo }: Props) {
  const [active, setActive] = useState<typeof filters[number]>('Tout');
  const shortsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const t = useT();
  const tc = useContentT();
  const { items: videos } = useLiveContent<typeof seedVideos[number]>('video', seedVideos);
  const featured = videos[0];
  const rest = videos.slice(1);
  const viewCounts = useViewCounts(videos.map((v) => `video:${v.id}`));

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {t('title.videos')}
        </div>
        <h1 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          {t('videos.tagline')}
        </h1>
      </div>

      {/* Pill tabs */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md mt-4">
        <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          {filters.map((f) => {
            const a = active === f;
            return (
              <button
                key={f}
                onClick={() => setActive(f)}
                className="flex-shrink-0 px-3.5 py-1.5 transition-all"
                style={{
                  background: a ? '#1a1a1a' : '#F4F4F6',
                  color: a ? 'white' : '#717182',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: a ? 600 : 500,
                  borderRadius: 999,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured — cinematic */}
      <section className="px-5 pt-1">
        <button onClick={() => onOpenVideo(featured)} className="block w-full text-left relative overflow-hidden aspect-[4/5]" style={{ borderRadius: 'var(--r-lg)' }}>
          <ImageWithFallback src={featured.image} alt={featured.title} className="w-full h-full object-cover"/>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)' }}/>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="inline-block px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', borderRadius: 999 }}>
              {tc.video(featured.id, 'type', featured.type).toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-black/60 text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, borderRadius: 999 }}>
              {featured.duration}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/95 flex items-center justify-center" style={{ borderRadius: 999 }}>
              <Play size={22} className="fill-[#0066FF] ml-1" style={{ color: '#0066FF' }} />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {tc.video(featured.id, 'title', featured.title)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-white/75" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
              <Eye size={13} /> {formatViews(viewCounts[`video:${featured.id}`])} vues
            </div>
          </div>
        </button>
      </section>

      {/* Shorts — teaser carousel opens dedicated /shorts feed */}
      <section className="mt-7">
        <div className="px-5 mb-3 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF3FA4, #FF8A00)', borderRadius: 999 }}>
              <Zap size={14} className="text-white fill-white"/>
            </div>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              Shorts
            </h3>
            <span className="ml-1 px-1.5 py-0.5 text-white" style={{ background: '#1a1a1a', fontFamily: 'Inter, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', borderRadius: 4 }}>
              FOR YOU
            </span>
          </div>
          <button onClick={() => navigate('/shorts')} className="flex items-center gap-1 text-[#FF3FA4]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
            Ouvrir le feed <ArrowRight size={13}/>
          </button>
        </div>

        <div ref={shortsRef} className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {shorts.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/shorts/${s.id}`)}
              className="flex-shrink-0 w-36 text-left transition-all hover:-translate-y-0.5"
            >
              <div className="relative aspect-[9/16] overflow-hidden mb-2" style={{ borderRadius: 'var(--r-md)', boxShadow: '0 10px 28px -18px rgba(255,63,164,0.6)' }}>
                <ImageWithFallback src={s.image} alt={s.title} className="w-full h-full object-cover"/>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)' }}/>
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', borderRadius: 999 }}>
                  <Zap size={9} className="text-white fill-white"/>
                  <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em' }}>SHORT</span>
                </div>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 600, borderRadius: 999 }}>
                  {s.duration}
                </span>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="line-clamp-2 text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.74rem', lineHeight: 1.25 }}>
                    {tc.short(s.id, 'title', s.title)}
                  </div>
                  <div className="flex items-center gap-1 text-white/80 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem' }}>
                    <Eye size={9}/> {s.views}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 600 }}>
                <Zap size={9} className="text-[#FF3FA4] fill-[#FF3FA4]"/> IPPOO
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="px-5 mt-7 flex items-end justify-between">
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          {t('videos.watch')}
        </h3>
        <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
          {rest.length} vidéos
        </span>
      </div>

      {/* Row list */}
      <section className="mt-3 px-5 space-y-3">
        {rest.map((v) => (
          <button key={v.id} onClick={() => onOpenVideo(v)} className="w-full text-left p-2.5 flex gap-3 bg-white hover:bg-[#FAFAFA] transition-colors" style={{ borderRadius: 'var(--r-md)' }}>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, color: '#0066FF', letterSpacing: '0.1em' }}>
                {tc.video(v.id, 'type', v.type).toUpperCase()}
              </div>
              <div className="line-clamp-3 my-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {tc.video(v.id, 'title', v.title)}
              </div>
              <div className="flex items-center gap-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                <Eye size={11} /> {formatViews(viewCounts[`video:${v.id}`])} vues
              </div>
            </div>
            <div className="relative w-32 aspect-video overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-sm)' }}>
              <ImageWithFallback src={v.image} alt={v.title} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/95 flex items-center justify-center" style={{ borderRadius: 999 }}>
                  <Play size={11} className="fill-[#0066FF] ml-0.5" style={{ color: '#0066FF' }}/>
                </div>
              </div>
              <span className="absolute bottom-1 right-1 px-1 py-px bg-black/75 text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 600 }}>
                {v.duration}
              </span>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

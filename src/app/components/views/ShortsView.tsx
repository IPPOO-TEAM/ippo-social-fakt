import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ChevronLeft, Heart, MessageCircle, Share2, Music2, Play, Pause, Volume2, VolumeX, Zap, Bookmark, Send, X } from 'lucide-react';
import type { Short } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import { AdminQuickDelete } from '../AdminQuickDelete';
import { useContentT } from '../../data/mock_translations';
import { useReactions, useFavorites, useComments } from '../../lib/storage';
import { toast } from 'sonner';
import { useHlsVideo } from '../../lib/use-hls-video';

const LOOPS = 4;

// Public sample vertical videos used as fallback when a short has no video URL.
const DEMO_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

function pickDemoVideo(id: string): string {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return DEMO_VIDEOS[h % DEMO_VIDEOS.length];
}

interface ShortSlideProps {
  src: string;
  poster: string;
  active: boolean;
  near: boolean;
  muted: boolean;
  paused: boolean;
}

function ShortSlide({ src, poster, active, near, muted, paused }: ShortSlideProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Only attach HLS when this slide is near the viewport, to avoid spinning up
  // many simultaneous HLS instances.
  useHlsVideo(videoRef, near ? src : '');

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active && !paused) {
      void el.play().catch((e) => console.log('short play rejected:', e));
    } else {
      el.pause();
      if (!active) {
        try { el.currentTime = 0; } catch { /* ignore */ }
      }
    }
  }, [active, paused]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  return (
    <>
      {!near && (
        <ImageWithFallback src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <video
        ref={videoRef}
        poster={poster}
        loop
        playsInline
        muted={muted}
        preload={near ? 'auto' : 'none'}
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => console.log('short video error', src)}
      />
    </>
  );
}

export function ShortsView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const tc = useContentT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const reactions = useReactions();
  const favorites = useFavorites();
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [doubleTap, setDoubleTap] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showPlayHint, setShowPlayHint] = useState(false);
  const lastTap = useRef<{ id: string; t: number } | null>(null);
  const { items: shorts } = useLiveContent<Short>('short');

  const handleTap = (s: Short) => {
    const now = Date.now();
    if (lastTap.current && lastTap.current.id === s.id && now - lastTap.current.t < 300) {
      // Double tap: like
      if (!reactions.has(s.id)) reactions.toggle(s.id);
      setDoubleTap(s.id);
      window.setTimeout(() => setDoubleTap((cur) => (cur === s.id ? null : cur)), 700);
      lastTap.current = null;
      return;
    }
    lastTap.current = { id: s.id, t: now };
    // Single tap: toggle play/pause for the active slide after the double-tap window.
    window.setTimeout(() => {
      if (lastTap.current && lastTap.current.id === s.id && lastTap.current.t === now) {
        setPaused((p) => !p);
        setShowPlayHint(true);
        window.setTimeout(() => setShowPlayHint(false), 500);
        lastTap.current = null;
      }
    }, 320);
  };

  const onShare = async (s: Short) => {
    const url = `${window.location.origin}/shorts/${s.id}`;
    try {
      if (navigator.share) await navigator.share({ title: s.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié');
      }
    } catch { /* ignore */ }
  };

  const feed = useMemo(() => {
    const out: Short[] = [];
    for (let i = 0; i < LOOPS; i++) out.push(...shorts);
    return out;
  }, [shorts]);

  useEffect(() => {
    if (!id || !containerRef.current) return;
    const startIdx = shorts.findIndex((s) => s.id === id);
    if (startIdx < 0) return;
    const h = containerRef.current.clientHeight;
    containerRef.current.scrollTo({ top: startIdx * h, behavior: 'instant' as ScrollBehavior });
    setActiveIdx(startIdx);
  }, [id, shorts]);

  // Resume playback when user changes slides.
  useEffect(() => { setPaused(false); }, [activeIdx]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== activeIdx) setActiveIdx(idx);
    if (idx >= feed.length - 3) {
      el.scrollTo({ top: (idx - shorts.length) * el.clientHeight, behavior: 'instant' as ScrollBehavior });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black max-w-2xl mx-auto overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/15 backdrop-blur-md" style={{ borderRadius: 999 }} aria-label="Retour">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-white" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', borderRadius: 999 }}>
            POUR VOUS
          </span>
          <span className="px-2 py-0.5 text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.14em' }}>
            ABONNEMENTS
          </span>
        </div>
        <button onClick={() => setMuted((m) => !m)} className="w-10 h-10 flex items-center justify-center bg-white/15 backdrop-blur-md" style={{ borderRadius: 999 }} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
          {muted ? <VolumeX size={18} className="text-white"/> : <Volume2 size={18} className="text-white"/>}
        </button>
      </div>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory', overscrollBehavior: 'contain' }}
      >
        {feed.map((s, i) => {
          const isLiked = reactions.has(s.id);
          const isSaved = favorites.has(s.id);
          const baseLikes = parseFloat((s.views ?? '0').replace(/[^\d.]/g, '')) || 0;
          const likeCount = (baseLikes + (isLiked ? 0.1 : 0)).toFixed(1);
          const active = i === activeIdx;
          const near = Math.abs(i - activeIdx) <= 1;
          const src = s.video ?? pickDemoVideo(s.id);
          return (
            <div
              key={`${s.id}-${i}`}
              className="relative w-full h-full snap-start snap-always overflow-hidden"
              onClick={() => handleTap(s)}
            >
              <ShortSlide
                src={src}
                poster={s.image}
                active={active}
                near={near}
                muted={muted}
                paused={active && paused}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.9) 100%)' }} />

              {/* Center play/pause indicator: shown only briefly after a tap or while paused */}
              {active && (paused || showPlayHint) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 bg-black/40 backdrop-blur-md flex items-center justify-center" style={{ borderRadius: 999, border: '2px solid rgba(255,255,255,0.5)' }}>
                    {paused ? (
                      <Play size={32} className="fill-white ml-1.5" style={{ color: 'white' }} />
                    ) : (
                      <Pause size={28} className="fill-white" style={{ color: 'white' }} />
                    )}
                  </div>
                </div>
              )}

              {doubleTap === s.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart size={120} className="fill-[#FF3FA4] drop-shadow-2xl" style={{ color: '#FF3FA4', animation: 'heartPop 700ms ease-out forwards' }} />
                </div>
              )}

              <div className="absolute right-2.5 bottom-28 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => reactions.toggle(s.id)} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/15 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90" style={{ borderRadius: 999 }}>
                    <Heart size={24} className={isLiked ? 'fill-[#FF3FA4]' : 'text-white'} style={{ color: isLiked ? '#FF3FA4' : 'white' }} />
                  </div>
                  <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                    {likeCount}k
                  </span>
                </button>
                <button onClick={() => setCommentsOpen(s.id)} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/15 backdrop-blur-md flex items-center justify-center" style={{ borderRadius: 999 }}>
                    <MessageCircle size={22} className="text-white" />
                  </div>
                  <CommentBadge id={s.id} fallback={12 + (i % shorts.length) * 7} />
                </button>
                <button onClick={() => {
                  favorites.toggle({ id: s.id, kind: 'video', title: s.title, image: s.image, meta: 'Short' });
                  toast.success(isSaved ? 'Retiré des favoris' : 'Ajouté aux favoris');
                }} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/15 backdrop-blur-md flex items-center justify-center" style={{ borderRadius: 999 }}>
                    <Bookmark size={21} className={isSaved ? 'fill-white' : 'text-white'} style={{ color: 'white' }} />
                  </div>
                  <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                    {isSaved ? 'Saved' : 'Save'}
                  </span>
                </button>
                <button onClick={() => onShare(s)} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/15 backdrop-blur-md flex items-center justify-center" style={{ borderRadius: 999 }}>
                    <Share2 size={21} className="text-white" />
                  </div>
                  <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                    Share
                  </span>
                </button>
                <AdminQuickDelete resource="short" id={s.id} label={`Le short « ${s.title} »`} />
                <div className="w-12 h-12 flex items-center justify-center" style={{ borderRadius: 999, background: 'linear-gradient(135deg, #1a1a1a, #444)', border: '2px solid rgba(255,255,255,0.4)', animation: active && !paused ? 'spin 6s linear infinite' : undefined }}>
                  <Music2 size={18} className="text-white" />
                </div>
              </div>

              <div className="absolute left-3 right-20 bottom-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 flex-shrink-0 bg-white flex items-center justify-center" style={{ borderRadius: 999 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.78rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>I</span>
                  </div>
                  <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                    IPPOO Social-Fact
                  </span>
                  <span className="ml-1 px-2 py-0.5 text-white" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', borderRadius: 999 }}>
                    OFFICIEL
                  </span>
                </div>
                <div className="text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                  {tc.short(s.id, 'title', s.title)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-white/85" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', fontWeight: 500 }}>
                  <Music2 size={12} />
                  <span className="truncate">Son original · IPPOO Social-Fact</span>
                </div>
              </div>

              <div className="absolute top-16 left-3 inline-flex items-center gap-1 px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 999 }}>
                <Zap size={10} className="text-white fill-white" />
                <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em' }}>SHORT · {s.duration}</span>
              </div>
            </div>
          );
        })}
      </div>

      {commentsOpen && <CommentsSheet shortId={commentsOpen} onClose={() => setCommentsOpen(null)} />}

      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0.4); opacity: 0; }
          30% { transform: scale(1.15); opacity: 1; }
          60% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CommentBadge({ id, fallback }: { id: string; fallback: number }) {
  const { count } = useComments(id);
  return (
    <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
      {count > 0 ? count : fallback}
    </span>
  );
}

function CommentsSheet({ shortId, onClose }: { shortId: string; onClose: () => void }) {
  const { list, add, toggleLike } = useComments(shortId);
  const [text, setText] = useState('');

  const onSubmit = () => {
    if (!text.trim()) return;
    add('Vous', text);
    setText('');
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white max-h-[70%] flex flex-col" style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
            Commentaires · {list.length}
          </span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-[#F4F4F6]" style={{ borderRadius: 999 }}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {list.length === 0 && (
            <div className="text-center text-[#717182] py-8" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
              Soyez le premier à commenter
            </div>
          )}
          {list.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 flex-shrink-0 bg-[#0066FF] flex items-center justify-center text-white" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>
                {c.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1a' }}>
                  {c.author}
                </div>
                <div className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  {c.text}
                </div>
                <button onClick={() => toggleLike(c.id)} className="flex items-center gap-1 mt-1 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  <Heart size={11} className={c.liked ? 'fill-[#FF3FA4]' : ''} style={{ color: c.liked ? '#FF3FA4' : '#717182' }} />
                  <span>{c.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#F0F0F0] px-3 py-2 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
            placeholder="Ajouter un commentaire…"
            className="flex-1 bg-[#F4F4F6] px-3 py-2 outline-none"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', borderRadius: 999 }}
          />
          <button onClick={onSubmit} disabled={!text.trim()} className="w-10 h-10 flex items-center justify-center bg-[#FF3FA4] text-white disabled:opacity-40" style={{ borderRadius: 999 }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

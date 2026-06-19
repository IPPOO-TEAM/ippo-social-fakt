import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ChevronDown, Play, Pause, Share2, Bookmark, Eye, Volume2, VolumeX, Maximize2, Heart, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useFavorites, useHistory, useComments, useViewCount } from '../../lib/storage';
import { Comments } from '../Comments';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useHlsVideo } from '../../lib/use-hls-video';

interface Video {
 id: string;
 title: string;
 type: string;
 duration: string;
 image: string;
 video?: string;
 videoUrl?: string;
}

const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

function fmt(s: number): string {
 if (!isFinite(s) || s < 0) return '0:00';
 const m = Math.floor(s / 60);
 const r = Math.floor(s % 60);
 return `${m}:${String(r).padStart(2, '0')}`;
}

interface Props {
 video: Video;
 onClose: () => void;
}

export function VideoDetail({ video, onClose }: Props) {
 const videoRef = useRef<HTMLVideoElement | null>(null);
 const [playing, setPlaying] = useState(true);
 const [cur, setCur] = useState(0);
 const [dur, setDur] = useState(0);
 const [muted, setMuted] = useState(false);
 const progress = dur > 0 ? (cur / dur) * 100 : 0;
 const src = video.videoUrl ?? video.video ?? DEMO_VIDEO_URL;
 useHlsVideo(videoRef, src);

 const togglePlay = () => {
 const el = videoRef.current; if (!el) return;
 if (el.paused) { void el.play().catch((e) => console.log('video play rejected:', e)); }
 else { el.pause(); }
 };
 const seekPct = (pct: number) => {
 const el = videoRef.current; if (!el || !dur) return;
 el.currentTime = (pct / 100) * dur;
 };
 const toggleFullscreen = () => {
 const el = videoRef.current; if (!el) return;
 if (document.fullscreenElement) document.exitFullscreen?.();
 else el.requestFullscreen?.().catch((e) => console.log('fullscreen rejected:', e));
 };
 const { has, toggle } = useFavorites();
 const { push } = useHistory();
 const saved = has(video.id);
 const [liked, setLiked] = useState(false);
 const [likes, setLikes] = useState(312);
 const [showComments, setShowComments] = useState(false);
 const { count: commentCount } = useComments(video.id);
 const viewTotal = useViewCount(`video:${video.id}`);
 const t = useT();
 const tc = useContentT();
 const vTitle = tc.video(video.id, 'title', video.title);
 const vType = tc.video(video.id, 'type', video.type);

 const onShare = async () => {
 const text = `${video.title} · IPPOO`;
 if (navigator.share) { try { await navigator.share({ title: video.title, text }); } catch {} }
 else if (navigator.clipboard) { navigator.clipboard.writeText(text); }
 };

 useEffect(() => {
 push({ id: video.id, kind: 'video', title: video.title, image: video.image, meta: video.type });
 }, [video.id]);

 return (
 <motion.div
 initial={{ y: '100%' }}
 animate={{ y: 0 }}
 exit={{ y: '100%' }}
 transition={{ type: 'spring', damping: 30, stiffness: 300 }}
 className="fixed inset-0 z-[70] bg-[#0F0A1F] overflow-y-auto overscroll-contain max-w-2xl mx-auto"
 >
 {/* Video player area */}
 <div className="relative aspect-video bg-black">
 <video
 ref={videoRef}
 poster={video.image}
 autoPlay
 playsInline
 muted={muted}
 className="w-full h-full object-cover bg-black"
 onPlay={() => setPlaying(true)}
 onPause={() => setPlaying(false)}
 onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
 onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
 onError={() => console.log('video error for', src)}
 />

 <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur flex items-center justify-center text-white" aria-label={t('common.close')}>
 <ChevronDown size={20} />
 </button>

 <button
 onClick={togglePlay}
 className="absolute inset-0 flex items-center justify-center"
 aria-label={playing ? 'Pause' : 'Play'}
 >
 <motion.div
 initial={false}
 animate={{ scale: playing ? 0 : 1, opacity: playing ? 0 : 1 }}
 transition={{ duration: 0.2 }}
 className="w-20 h-20 bg-white/95 flex items-center justify-center shadow-2xl"
 >
 <Play size={32} className="fill-[#0F0A1F] ml-1" style={{ color: '#0F0A1F' }} />
 </motion.div>
 </button>

 {/* Bottom controls */}
 <div className="absolute bottom-0 left-0 right-0 p-4">
 <div className="relative h-1 bg-white/20 mb-2">
 <div className="absolute inset-y-0 left-0 bg-[#0066FF]" style={{ width: `${progress}%` }} />
 <input
 type="range"
 min={0}
 max={100}
 step={0.1}
 value={progress}
 onChange={(e) => seekPct(Number(e.target.value))}
 className="absolute inset-0 opacity-0 cursor-pointer"
 aria-label={t('player.progress')}
 />
 </div>
 <div className="flex items-center justify-between text-white">
 <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
 {playing ? <Pause size={20} className="fill-white"/> : <Play size={20} className="fill-white ml-0.5"/>}
 </button>
 <div className="flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
 <span>{fmt(cur)} / {dur ? fmt(dur) : video.duration}</span>
 <button onClick={() => setMuted((m) => !m)} aria-label="Mute">
 {muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
 </button>
 <button onClick={toggleFullscreen} aria-label="Plein écran">
 <Maximize2 size={16}/>
 </button>
 </div>
 </div>
 </div>
 </div>

 <div className="px-5 py-5 text-white">
 <span className="inline-block px-2.5 py-1 bg-white/10 mb-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
 {vType.toUpperCase()}
 </span>
 <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
 {vTitle}
 </h1>
 <div className="flex items-center gap-3 mt-2 opacity-70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>
 <span className="flex items-center gap-1"><Eye size={13} /> {viewTotal != null ? viewTotal.toLocaleString('fr-FR') : '—'}</span>
 <span>·</span>
 <span>{t('video.ago_2d')}</span>
 </div>

 <div className="flex items-center gap-2 mt-5 pb-5 border-b border-white/10">
 <button onClick={() => { setLiked((l) => !l); setLikes((n) => n + (liked ? -1 : 1)); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition ${liked ? 'bg-[#FF3FA4]' : 'bg-white/10 hover:bg-white/15'}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
 <Heart size={16} className={liked ? 'fill-white' : ''} /> {likes}
 </button>
 <button onClick={() => setShowComments((v) => !v)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/15 transition" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
 <MessageCircle size={16} /> {commentCount}
 </button>
 <button
 onClick={() => toggle({ id: video.id, kind: 'video', title: video.title, image: video.image, meta: video.type })}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition ${saved ? 'bg-[#0066FF]' : 'bg-white/10 hover:bg-white/15'}`}
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}
 >
 <Bookmark size={16} className={saved ? 'fill-white' : ''} />
 </button>
 <button onClick={onShare} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 transition" aria-label={t('common.share')}>
 <Share2 size={16} />
 </button>
 </div>

 {showComments && (
 <div className="mt-4 bg-white p-4 -mx-1 text-[#1a1a1a]">
 <Comments targetId={video.id} accent="#FF3FA4"/>
 </div>
 )}

 <p className="opacity-85 mt-5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.7 }}>
 {t('video.synopsis')}
 </p>

 <h3 className="mt-6 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
 {t('video.up_next')}
 </h3>
 <div className="space-y-3">
 {[1, 2].map((i) => (
 <div key={i} className="flex gap-3">
 <div className="relative w-32 aspect-video overflow-hidden flex-shrink-0">
 <ImageWithFallback src={video.image} alt="" className="w-full h-full object-cover"/>
 <div className="absolute inset-0 bg-black/30"/>
 <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600 }}>
 3:24
 </span>
 </div>
 <div className="flex-1 min-w-0">
 <div className="line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>
 {t('video.suggestion')} {vType.toLowerCase()} #{i}
 </div>
 <div className="opacity-60 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
 IPPOO · 1.{i}{t('video.views_short')}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 );
}

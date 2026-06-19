import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ChevronDown, Share2, Bookmark, Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Download, ListMusic } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../../lib/focus-trap';
import { motion } from 'motion/react';
import { useFavorites, useHistory, useViewCount } from '../../lib/storage';
import { episodes as seedEpisodes, type Episode } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import type { PlayingTrack } from '../MiniPlayer';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useSubscription } from '../../lib/subscription';
import { useNavigate } from 'react-router';
import { Paywall } from '../Paywall';
import { useAudioSelector, shallowEqual, audioEngine, formatTime } from '../../lib/audio-engine';

interface Props {
 track: PlayingTrack & { duration?: string };
 playing: boolean;
 onToggle: () => void;
 onClose: () => void;
}

export function EpisodeDetail({ track, playing, onToggle, onClose }: Props) {
 const t = useT();
 const tc = useContentT();
 const trackTitle = tc.episode(track.id, 'title', track.title);
 const trackShow = tc.episode(track.id, 'show', track.show);
 const { has, toggle } = useFavorites();
 const { push } = useHistory();
 const saved = has(track.id);
 useViewCount(`episode:${track.id}`);
 const { duration: dur, currentTime: cur } = useAudioSelector(
   (e) => ({ duration: e.duration || 0, currentTime: e.currentTime || 0 }),
   shallowEqual,
 );
 const progress = dur > 0 ? (cur / dur) * 100 : 0;
 const setProgress = (pct: number) => audioEngine.seek((pct / 100) * (dur || 0));
 const [downloaded, setDownloaded] = useState(false);
 const [queueOpen, setQueueOpen] = useState(false);
 const { isPremium } = useSubscription();
 const navigate = useNavigate();
 const rootRef = useRef<HTMLDivElement | null>(null);
 useFocusTrap(rootRef, true);
 useEffect(() => {
   const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
   window.addEventListener('keydown', h);
   return () => window.removeEventListener('keydown', h);
 }, [onClose]);
 const { items: episodes } = useLiveContent<Episode>('episode', seedEpisodes);
 const episodeMeta = episodes.find((e) => e.id === track.id);
 const locked = !!episodeMeta?.premium && !isPremium;

 useEffect(() => {
 push({ id: track.id, kind: 'episode', title: track.title, image: track.image, meta: track.show });
 try { setDownloaded(localStorage.getItem(`ippoo:downloaded:${track.id}`) === '1'); } catch {}
 }, [track.id]);

 const skip = (delta: number) => audioEngine.seek(cur + delta);
 const onShare = async () => {
 const text = `${track.title} · ${track.show} · IPPOO`;
 if (navigator.share) { try { await navigator.share({ title: track.title, text }); } catch {} }
 else if (navigator.clipboard) { navigator.clipboard.writeText(text); }
 };
 const onDownload = () => {
 try { localStorage.setItem(`ippoo:downloaded:${track.id}`, '1'); } catch {}
 setDownloaded(true);
 };

 return (
 <motion.div
 ref={rootRef}
 role="dialog"
 aria-modal="true"
 aria-label={trackTitle}
 initial={{ y: '100%' }}
 animate={{ y: 0 }}
 exit={{ y: '100%' }}
 transition={{ type: 'spring', damping: 30, stiffness: 300 }}
 drag="y"
 dragDirectionLock
 dragConstraints={{ top: 0, bottom: 0 }}
 dragElastic={{ top: 0, bottom: 0.5 }}
 onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
 className="fixed inset-0 z-[70] overflow-hidden max-w-2xl mx-auto">
 {/* Ambient background from cover */}
 <div className="absolute inset-0">
 <ImageWithFallback src={track.image} alt="" className="w-full h-full object-cover scale-150 blur-3xl opacity-60"/>
 <div className="absolute inset-0 bg-[#0F0A1F]/90"/>
 </div>

 <div className="relative h-full flex flex-col text-white px-5 pt-4 pb-8">
 <div className="flex items-center justify-between">
 <button onClick={onClose} className="w-10 h-10 bg-white/10 backdrop-blur flex items-center justify-center" aria-label={t('player.minimize')}>
 <ChevronDown size={20} />
 </button>
 <div className="text-center">
 <div className="opacity-70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em' }}>
 {t('player.now_playing')}
 </div>
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
 {trackShow}
 </div>
 </div>
 <button onClick={() => setQueueOpen((v) => !v)} className="w-10 h-10 bg-white/10 backdrop-blur flex items-center justify-center" aria-label={t('player.queue')}>
 <ListMusic size={18} />
 </button>
 </div>

 <div className="flex-1 flex items-center justify-center my-6">
 <div
 className={`w-full aspect-square max-w-[340px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-transform duration-700 ${
 playing ? 'scale-100' : 'scale-95'
 }`}
 >
 <ImageWithFallback src={track.image} alt={trackTitle} className="w-full h-full object-cover"/>
 </div>
 </div>

 <div className="space-y-5">
 {locked && (
 <Paywall
 title="Podcast réservé aux Premium"
 message="Écoutez l'intégralité de l'épisode en passant Premium."
 onUpgrade={() => navigate('/pricing')}
 />
 )}
 <div>
 <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
 {trackTitle}
 </h2>
 <p className="opacity-70 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
 {trackShow}
 </p>
 </div>

 <div>
 <input
 type="range"
 min={0}
 max={100}
 value={progress}
 onChange={(e) => setProgress(Number(e.target.value))}
 className="w-full accent-white h-1"
 aria-label={t('player.progress')}
 />
 <div className="flex items-center justify-between opacity-70 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
 <span>{formatTime(cur)}</span>
 <span>{dur ? formatTime(dur) : (track.duration ?? '--:--')}</span>
 </div>
 </div>

 <div className="flex items-center justify-between">
 <button onClick={() => audioEngine.seek(0)} className="w-10 h-10 bg-white/5 flex items-center justify-center" aria-label={t('player.previous')}>
 <SkipBack size={18} />
 </button>
 <button onClick={() => skip(-15)} className="w-12 h-12 bg-white/10 flex items-center justify-center" aria-label="-15s">
 <Rewind size={20} />
 </button>
 <button
 onClick={() => { if (locked) { navigate('/pricing'); return; } onToggle(); }}
 className={`w-16 h-16 bg-white text-[#0F0A1F] flex items-center justify-center shadow-2xl ${locked ? 'opacity-60' : ''}`}
 aria-label={playing ? 'Pause' : 'Play'}
 >
 {playing ? <Pause size={22} className="fill-current"/> : <Play size={22} className="fill-current ml-1"/>}
 </button>
 <button onClick={() => skip(15)} className="w-12 h-12 bg-white/10 flex items-center justify-center" aria-label="+15s">
 <FastForward size={20} />
 </button>
 <button onClick={() => audioEngine.seek(dur)} className="w-10 h-10 bg-white/5 flex items-center justify-center" aria-label={t('player.next')}>
 <SkipForward size={18} />
 </button>
 </div>

 <div className="flex items-center justify-around pt-2 border-t border-white/10">
 <button onClick={onDownload} className={`flex flex-col items-center gap-1 ${downloaded ? 'text-[#00C853]' : 'opacity-80 hover:opacity-100'}`} aria-label={t('player.download')}>
 <Download size={18} />
 <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{downloaded ? t('player.downloaded') : t('player.download')}</span>
 </button>
 <button
 onClick={() => toggle({ id: track.id, kind: 'episode', title: track.title, image: track.image, meta: track.show })}
 className={`flex flex-col items-center gap-1 ${saved ? 'text-[#FF8A00]' : 'opacity-80 hover:opacity-100'}`}
 aria-label={t('sheet.favorite')}
 >
 <Bookmark size={18} className={saved ? 'fill-current' : ''} />
 <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{saved ? t('player.saved') : t('player.save')}</span>
 </button>
 <button onClick={onShare} className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100" aria-label={t('common.share')}>
 <Share2 size={18} />
 <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{t('common.share')}</span>
 </button>
 </div>
 </div>
 </div>

 {queueOpen && (
 <motion.div
 initial={{ y: '100%' }}
 animate={{ y: 0 }}
 exit={{ y: '100%' }}
 className="absolute inset-x-0 bottom-0 top-20 bg-[#0F0A1F] z-10 overflow-y-auto px-5 py-4 text-white"
 >
 <div className="flex items-center justify-between mb-4">
 <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>{t('player.queue')}</h3>
 <button onClick={() => setQueueOpen(false)} className="w-9 h-9 bg-white/10 flex items-center justify-center" aria-label={t('common.close')}>
 <ChevronDown size={18} />
 </button>
 </div>
 <div className="space-y-2">
 {episodes.filter((e) => e.id !== track.id).map((e) => {
 const eTitle = tc.episode(e.id, 'title', e.title);
 const eShow = tc.episode(e.id, 'show', e.show);
 const eDur = tc.episode(e.id, 'duration', e.duration);
 return (
 <div key={e.id} className="flex items-center gap-3 p-2 bg-white/5">
 <div className="w-12 h-12 overflow-hidden flex-shrink-0">
 <ImageWithFallback src={e.image} alt={eTitle} className="w-full h-full object-cover"/>
 </div>
 <div className="flex-1 min-w-0">
 <div className="line-clamp-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 600 }}>{eTitle}</div>
 <div className="opacity-60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{eShow} · {eDur}</div>
 </div>
 </div>
 );
 })}
 </div>
 </motion.div>
 )}
 </motion.div>
 );
}

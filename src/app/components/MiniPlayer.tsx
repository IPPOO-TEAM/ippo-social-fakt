import { Play, Pause, X, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { tap } from '../lib/haptic';
import { useT } from '../lib/i18n';
import { useAudioSelector, shallowEqual } from '../lib/audio-engine';

export interface PlayingTrack {
 id: string;
 title: string;
 show: string;
 image: string;
 color: string;
 audioUrl?: string;
}

interface Props {
 track: PlayingTrack;
 playing: boolean;
 onToggle: () => void;
 onClose: () => void;
 onExpand?: () => void;
}

export function MiniPlayer({ track, playing, onToggle, onClose, onExpand }: Props) {
 const t = useT();
 const { currentTime, duration, loading } = useAudioSelector(
   (e) => ({ currentTime: e.currentTime, duration: e.duration, loading: e.loading }),
   shallowEqual,
 );
 const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
 return (
 <div
 className="fixed left-2 right-2 z-50 max-w-[640px] mx-auto"
 style={{ bottom: `calc(64px + env(safe-area-inset-bottom))` }}
 >
 <div
 className="bg-white/95 backdrop-blur-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-hidden"
 style={{ borderRadius: 'var(--r-lg)'}}
 >
 <div className="h-0.5 bg-black/5 relative overflow-hidden">
 <div className="absolute inset-y-0 left-0 bg-[#0066FF] transition-[width] duration-200" style={{ width: `${pct || 8}%` }}/>
 </div>
 <div className="flex items-center gap-3 px-2.5 py-2">
 <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left p-1" aria-label={t('player.expand')}>
 <div className="w-11 h-11 overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-xs)'}}>
 <ImageWithFallback src={track.image} alt={track.title} className="w-full h-full object-cover"/>
 </div>
 <div className="flex-1 min-w-0">
 <div className="truncate" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>
 {track.title}
 </div>
 <div className="truncate text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
 {track.show}
 </div>
 </div>
 </button>
 <button
 onClick={() => { tap(); onToggle(); }}
 className="w-11 h-11 bg-[#0066FF] text-white flex items-center justify-center shadow-lg flex-shrink-0"
 style={{ borderRadius: 999 }}
 aria-label={playing ? 'Pause' : 'Play'}
 >
 {loading ? <Loader2 size={16} className="animate-spin"/> : playing ? <Pause size={16} className="fill-white"/> : <Play size={16} className="fill-white ml-0.5"/>}
 </button>
 <button onClick={onClose} className="w-9 h-9 hover:bg-black/5 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 999 }} aria-label={t('common.close')}>
 <X size={16} className="text-[#717182]"/>
 </button>
 </div>
 </div>
 </div>
 );
}

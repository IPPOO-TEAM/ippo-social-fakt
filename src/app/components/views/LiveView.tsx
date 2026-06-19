import { motion } from 'motion/react';
import { ChevronLeft, Radio, Play, Calendar, Bell, Headphones, Share2, Pause, ChevronRight, Tv, Volume2, VolumeX, Maximize2, Eye, MessageCircle, Send, Pin, Sparkles, Heart, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useT } from '../../lib/i18n';
import { loadPrograms, KEY_PROGRAMS } from '../../admin/AdminPrograms';
import { audioEngine, useAudioSelector, shallowEqual } from '../../lib/audio-engine';
import { useHlsVideo } from '../../lib/use-hls-video';
import { LivePoll } from './live/LivePoll';
import { LiveAntenneCTA } from './live/LiveAntenneCTA';

const RADIO_STREAM_FALLBACK = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3';
const TV_STREAM_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface Props { onBack: () => void; }

interface Slot {
  time: string;
  end: string;
  title: string;
  host: string;
  hostInitials: string;
  category: string;
  cover: string;
  live?: boolean;
  audio?: string;
}

function usePrograms(): Slot[] {
  const [items, setItems] = useState<Slot[]>(() => loadPrograms());
  useEffect(() => {
    const refresh = () => setItems(loadPrograms());
    const cross = (e: StorageEvent) => { if (e.key === KEY_PROGRAMS) refresh(); };
    window.addEventListener(`storage:${KEY_PROGRAMS}`, refresh);
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(`storage:${KEY_PROGRAMS}`, refresh);
      window.removeEventListener('storage', cross);
    };
  }, []);
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

const replays = [
  { id: 'r1', title: 'Spécial diaspora · retours réussis', host: 'Aïcha Diallo', date: 'Hier', duration: '52 min', plays: '4.2k', image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=600&q=80' },
  { id: 'r2', title: 'Table ronde : eau & assainissement', host: 'Mamadou Bah', date: 'Lun.', duration: '1h 12', plays: '3.1k', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' },
  { id: 'r3', title: 'Direct du marché de Dantokpa', host: 'Fatou Ndiaye', date: 'Dim.', duration: '38 min', plays: '6.8k', image: 'https://images.unsplash.com/photo-1589707197624-27802d81f462?w=800&q=80' },
];

interface LiveStream {
  id: string;
  title: string;
  category: string;
  host: string;
  cover: string;
  viewers: number;
  startedAgo: string;
}

const liveStreams: LiveStream[] = [
  { id: 'tv1', title: 'Édition spéciale · marchés de Cotonou', category: 'JT en direct', host: 'Rédaction IPPOO', cover: 'https://images.unsplash.com/photo-1589707197624-27802d81f462?w=1200&q=80', viewers: 8420, startedAgo: '12 min' },
  { id: 'tv2', title: 'Plateau économique · franc CFA', category: 'Débat', host: 'Mamadou Bah', cover: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80', viewers: 3120, startedAgo: '38 min' },
  { id: 'tv3', title: 'Reportage terrain · coopératives d\'Abomey', category: 'Reportage', host: 'Awa Touré', cover: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80', viewers: 1840, startedAgo: '1 h' },
  { id: 'tv4', title: 'Conférence santé · paludisme', category: 'Santé', host: 'Dr Koné', cover: 'https://images.unsplash.com/photo-1559757175-08c5e0d3e1ec?w=800&q=80', viewers: 940, startedAgo: '2 h' },
];

interface ChatMsg { id: string; user: string; color: string; text: string; pinned?: boolean; }
const seedChat: ChatMsg[] = [
  { id: 'm1', user: 'Aminata · Dantokpa', color: '#FF3FA4', text: 'Excellente analyse sur le franc CFA !', pinned: true },
  { id: 'm2', user: 'Kouassi · Akpakpa', color: '#0066FF', text: 'Question : qu\'en est-il des PME locales ?' },
  { id: 'm3', user: 'Fatou · Cadjèhoun', color: '#E8B21A', text: "Bravo à l'équipe IPPOO" },
  { id: 'm4', user: 'Ibrahim · Parakou', color: '#9B51E0', text: 'On suit depuis l\'intérieur, merci pour ce plateau' },
  { id: 'm5', user: 'Mariam · Calavi', color: '#FF6A00', text: 'Pouvez-vous reparler des coopératives ?' },
];

const moments = [
  { id: 'mo1', title: 'Le franc CFA expliqué en 60 secondes', duration: '1:02', views: '12k', cover: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=80' },
  { id: 'mo2', title: 'Échange tendu sur la dette extérieure', duration: '2:34', views: '8.7k', cover: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&q=80' },
  { id: 'mo3', title: 'Témoignage : commerçante de Dantokpa', duration: '0:48', views: '21k', cover: 'https://images.unsplash.com/photo-1589707197624-27802d81f462?w=600&q=80' },
  { id: 'mo4', title: 'La coopérative agricole de Abomey', duration: '1:45', views: '6.3k', cover: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80' },
];

const guests = [
  { id: 'g1', name: 'Pr. Aminata Touré', role: 'Économiste, UAC', initials: 'AT', color: '#0066FF' },
  { id: 'g2', name: 'Kouadio Yao', role: 'Président CCIB', initials: 'KY', color: '#FF3FA4' },
  { id: 'g3', name: 'Sarah Bamba', role: 'Journaliste éco', initials: 'SB', color: '#9B51E0' },
];

const POLL_ID = 'live-cfa-reform-2026';
const pollOptions = [
  { id: 'p1', label: 'Très favorable' },
  { id: 'p2', label: 'Favorable avec réserves' },
  { id: 'p3', label: 'Défavorable' },
  { id: 'p4', label: 'Sans opinion' },
];

const alerts = [
  { zone: 'Akpakpa', kind: "Coupure d'eau", time: '22h → 05h', tone: '#0066FF', desc: 'Maintenance des conduites principales.' },
  { zone: 'Cadjèhoun', kind: 'Manifestation prévue', time: 'Sam. 10h', tone: '#E8B21A', desc: 'Marche pacifique au Plateau.' },
  { zone: 'Plateau', kind: 'Travaux voirie', time: 'Lun. → Ven.', tone: '#FF8A00', desc: 'Circulation alternée sur l\'boulevard Steinmetz.' },
];

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function LiveView({ onBack }: Props) {
  const t = useT();
  const program = usePrograms();
  const engine = useAudioSelector(
    (e) => ({ src: e.src, playing: e.playing, loading: e.loading }),
    shallowEqual,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [tab, setTab] = useState<'grille' | 'replay' | 'alertes'>('grille');
  const [mode, setMode] = useState<'radio' | 'tv'>('radio');
  const [activeStream, setActiveStream] = useState<LiveStream>(liveStreams[0]);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>(seedChat);
  const [chatInput, setChatInput] = useState('');
  const [hearts, setHearts] = useState(847);
  const [listeners, setListeners] = useState(2412);
  const [streamViewers, setStreamViewers] = useState<Record<string, number>>(() =>
    Object.fromEntries(liveStreams.map((s) => [s.id, s.viewers])),
  );
  useHlsVideo(videoRef, TV_STREAM_URL);

  // Live program audio URL (admin-configured) wins over fallback
  // (note: liveShow is computed lower; we'll resolve via getter)
  const getRadioUrl = () => {
    const live = program.find((p) => p.live);
    return live?.audio?.trim() || RADIO_STREAM_FALLBACK;
  };
  const radioPlaying = mode === 'radio' && engine.src === getRadioUrl() && engine.playing;

  // Radio play/pause via shared engine
  const toggleRadio = () => {
    const url = getRadioUrl();
    if (engine.src === url) audioEngine.toggle();
    else audioEngine.setSource(url, true);
  };

  // TV: drive the <video> element imperatively + react to muted
  useEffect(() => {
    const el = videoRef.current; if (!el) return;
    el.muted = muted;
  }, [muted]);

  // When switching to radio mode, pause any TV video. When leaving radio, leave engine alone (mini player can pick it up).
  useEffect(() => {
    if (mode === 'radio') { videoRef.current?.pause(); }
    if (mode === 'tv') { /* stop radio so we don't have two streams at once */
      if (engine.playing) audioEngine.pause();
    }
  }, [mode]);

  // Drift listeners & viewers count to feel live
  useEffect(() => {
    const id = setInterval(() => {
      setListeners((n) => Math.max(800, n + Math.round((Math.random() - 0.45) * 35)));
      setStreamViewers((m) => {
        const next = { ...m };
        for (const k of Object.keys(next)) {
          next[k] = Math.max(80, next[k] + Math.round((Math.random() - 0.5) * 28));
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Simulated incoming chat messages
  useEffect(() => {
    const pool: { user: string; color: string; text: string }[] = [
      { user: 'Aïssatou · Fidjrossè', color: '#FF6A00', text: "C'est passionnant, merci !" },
      { user: 'Yao · Ouidah', color: '#00C853', text: 'Le débat est vraiment de qualité' },
      { user: 'Ramata · Calavi', color: '#9B51E0', text: 'Quelle est votre position sur la BCEAO ?' },
      { user: 'Kader · Saint-Michel', color: '#E8B21A', text: 'On vous suit depuis le Burkina' },
      { user: 'Sira · Cadjèhoun', color: '#FF3FA4', text: 'Continuez, super émission' },
      { user: 'Mahmoud · Parakou', color: '#0066FF', text: 'Pouvez-vous donner un exemple concret ?' },
      { user: 'Lina · Diaspora Paris', color: '#1a1a1a', text: 'On écoute depuis la France 🇫🇷' },
    ];
    const id = setInterval(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setChat((c) => [...c.slice(-40), { id: `m-${Date.now()}`, ...pick }]);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChat((c) => [...c, { id: `m-${Date.now()}`, user: 'Vous', color: '#1a1a1a', text }]);
    setChatInput('');
  };

  const liveIdx = program.findIndex((p) => p.live);
  const liveShow = program[liveIdx];
  const upNext = program.slice(liveIdx + 1, liveIdx + 4);

  const start = timeToMin(liveShow.time);
  const end = timeToMin(liveShow.end);
  const [progress, setProgress] = useState(40);
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => (p < 100 ? p + 0.1 : p)), 6000);
    return () => clearInterval(id);
  }, []);
  const elapsedMin = Math.floor(((end - start) * progress) / 100);

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto overscroll-contain"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" style={{ borderRadius: 999 }} aria-label={t('common.back')}>
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          {mode === 'radio' ? 'IPPOO Radio' : 'IPPOO TV'} · {t('live.title')}
        </h1>
      </div>

      {/* Mode switch Radio / TV */}
      <div className="px-5 pt-4">
        <div className="bg-[#F4F4F6] p-1 flex gap-1" style={{ borderRadius: 999 }}>
          {([['radio', Radio, 'Radio'], ['tv', Tv, 'TV en direct']] as const).map(([k, Icon, label]) => {
            const a = mode === k;
            return (
              <button
                key={k}
                onClick={() => setMode(k)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-all"
                style={{
                  background: a ? '#1a1a1a' : 'transparent',
                  color: a ? 'white' : '#717182',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: 999,
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'tv' && (
        <>
          {/* Video player */}
          <div className="px-5 pt-4">
            <div className="relative overflow-hidden bg-black aspect-video" style={{ borderRadius: 14 }}>
              <video
                ref={videoRef}
                poster={activeStream.cover}
                autoPlay
                playsInline
                loop
                muted={muted}
                className="absolute inset-0 w-full h-full object-cover"
                onPlay={() => setVideoPlaying(true)}
                onPause={() => setVideoPlaying(false)}
                onError={() => console.log('TV stream error')}
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FF3B30]" style={{ borderRadius: 999 }}>
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex h-full w-full bg-white opacity-60 animate-ping" style={{ borderRadius: 999 }} />
                    <span className="relative inline-flex w-1.5 h-1.5 bg-white" style={{ borderRadius: 999 }} />
                  </span>
                  <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em' }}>EN DIRECT</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md text-white" style={{ borderRadius: 999 }}>
                  <Eye size={11} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700 }}>
                    {(streamViewers[activeStream.id] ?? activeStream.viewers).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  const el = videoRef.current; if (!el) return;
                  if (el.paused) void el.play().catch((e) => console.log('video play rejected:', e));
                  else el.pause();
                }}
                className="absolute inset-0 flex items-center justify-center"
                aria-label={videoPlaying ? 'Pause' : 'Lecture'}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: videoPlaying ? 0 : 1, opacity: videoPlaying ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="w-16 h-16 bg-white/95 flex items-center justify-center shadow-2xl"
                  style={{ borderRadius: 999 }}
                >
                  <Play size={26} className="text-[#1a1a1a] fill-current ml-1" />
                </motion.div>
              </button>

              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                <div className="text-white min-w-0">
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', opacity: 0.85 }}>
                    {activeStream.category.toUpperCase()} · DEPUIS {activeStream.startedAgo.toUpperCase()}
                  </div>
                  <div className="truncate" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                    {activeStream.title}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setMuted((m) => !m)} className="w-8 h-8 bg-black/60 backdrop-blur-md text-white flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Son">
                    {muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                  </button>
                  <button
                    onClick={() => {
                      const el = videoRef.current; if (!el) return;
                      if (document.fullscreenElement) document.exitFullscreen?.();
                      else el.requestFullscreen?.().catch((e) => console.log('fullscreen rejected:', e));
                    }}
                    className="w-8 h-8 bg-black/60 backdrop-blur-md text-white flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Plein écran">
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 bg-[#F4F4F6] flex items-center justify-center flex-shrink-0" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 800, color: '#1a1a1a' }}>
                  {activeStream.host.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#1a1a1a' }}>{activeStream.host}</div>
                  <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>Présentateur en plateau</div>
                </div>
              </div>
              <button className="w-9 h-9 bg-[#FAFAFA] flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Partager">
                <Share2 size={14} className="text-[#1a1a1a]" />
              </button>
            </div>
          </div>

          {/* Other live streams */}
          <section className="px-5 mt-6">
            <div className="flex items-end justify-between mb-2.5">
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                Autres directs
              </h3>
              <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                {liveStreams.length} en cours
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {liveStreams.filter((s) => s.id !== activeStream.id).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStream(s)}
                  className="text-left bg-white border border-[#F0F0F0] overflow-hidden"
                  style={{ borderRadius: 12 }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <ImageWithFallback src={s.cover} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#FF3B30]" style={{ borderRadius: 4 }}>
                      <span className="w-1 h-1 bg-white" style={{ borderRadius: 999 }} />
                      <span className="text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em' }}>LIVE</span>
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 text-white" style={{ borderRadius: 4 }}>
                      <Eye size={9} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700 }}>{(streamViewers[s.id] ?? s.viewers).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: '#FF3B30', letterSpacing: '0.1em' }}>
                      {s.category.toUpperCase()}
                    </div>
                    <div className="mt-0.5 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#1a1a1a', lineHeight: 1.3 }}>
                      {s.title}
                    </div>
                    <div className="text-[#717182] mt-1 truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem' }}>{s.host}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Live stats strip */}
          <section className="px-5 mt-6">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-[#FAFAFA]" style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-1.5 text-[#FF3B30]">
                  <Eye size={13} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>VIVO</span>
                </div>
                <div className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                  {(streamViewers[activeStream.id] ?? activeStream.viewers).toLocaleString('fr-FR')}
                </div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem' }}>spectateurs</div>
              </div>
              <div className="p-3 bg-[#FAFAFA]" style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-1.5 text-[#FF3FA4]">
                  <Heart size={13} className="fill-current" />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>RÉACTIONS</span>
                </div>
                <button onClick={() => setHearts((h) => h + 1)} className="mt-1 text-left" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                  {hearts.toLocaleString('fr-FR')}
                </button>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem' }}>tap pour aimer</div>
              </div>
              <div className="p-3 bg-[#FAFAFA]" style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-1.5 text-[#0066FF]">
                  <TrendingUp size={13} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>PIC</span>
                </div>
                <div className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                  12 380
                </div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem' }}>aujourd'hui</div>
              </div>
            </div>
          </section>

          {/* Live chat */}
          <section className="px-5 mt-6">
            <div className="flex items-end justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-[#0066FF]" />
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                  Tchat en direct
                </h3>
                <span className="px-1.5 py-0.5 bg-[#FF3B30] text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em', borderRadius: 4 }}>LIVE</span>
              </div>
              <span className="text-[#717182] flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                <Users size={11} /> {chat.length * 47} en ligne
              </span>
            </div>
            <div className="bg-[#FAFAFA] overflow-hidden" style={{ borderRadius: 14 }}>
              <div className="max-h-72 overflow-y-auto px-3 py-3 space-y-2.5">
                {chat.map((m) => (
                  <div key={m.id} className="flex items-start gap-2">
                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 text-white" style={{ background: m.color, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700 }}>
                      {m.user.charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex-1 min-w-0 ${m.pinned ? 'p-2 bg-white border border-[#FFE08A]' : ''}`} style={m.pinned ? { borderRadius: 10 } : undefined}>
                      {m.pinned && (
                        <div className="flex items-center gap-1 mb-0.5 text-[#E8B21A]">
                          <Pin size={10} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em' }}>ÉPINGLÉ PAR ANIMATEUR</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: m.color }}>{m.user}</span>
                      </div>
                      <div className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChat} className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-[#F0F0F0]">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Posez votre question à l'antenne…"
                  className="flex-1 px-3 py-2 bg-[#F4F4F6] outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/30"
                  style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}
                />
                <button type="submit" className="w-9 h-9 bg-[#0066FF] text-white flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Envoyer">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </section>

          <LivePoll
            pollId={POLL_ID}
            question="Êtes-vous favorable à la réforme du franc CFA ?"
            options={pollOptions}
          />


          {/* Moments forts (clips) */}
          <section className="px-5 mt-6">
            <div className="flex items-end justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#E8B21A]" />
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                  Moments forts
                </h3>
              </div>
              <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                Clips de l'émission
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
              {moments.map((m) => (
                <button key={m.id} className="flex-shrink-0 w-44 text-left" >
                  <div className="relative aspect-[9/13] overflow-hidden" style={{ borderRadius: 12 }}>
                    <ImageWithFallback src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 text-white" style={{ borderRadius: 4, fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700 }}>
                      {m.duration}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <div className="line-clamp-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.25 }}>
                        {m.title}
                      </div>
                      <div className="flex items-center gap-1 mt-1 opacity-85" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem' }}>
                        <Eye size={10} /> {m.views} vues
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Featured guests */}
          <section className="px-5 mt-6">
            <div className="flex items-center gap-2 mb-2.5">
              <Mic size={15} className="text-[#9B51E0]" />
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                Sur le plateau
              </h3>
            </div>
            <div className="space-y-2">
              {guests.map((g) => (
                <div key={g.id} className="flex items-center gap-3 p-2.5 bg-white border border-[#F0F0F0]" style={{ borderRadius: 12 }}>
                  <div className="w-11 h-11 flex items-center justify-center text-white flex-shrink-0" style={{ background: g.color, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.85rem' }}>
                    {g.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>{g.name}</div>
                    <div className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem' }}>{g.role}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-[#FAFAFA] flex items-center gap-1" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#1a1a1a' }}>
                    Suivre
                  </button>
                </div>
              ))}
            </div>
          </section>

          <LiveAntenneCTA
            title="Votre avis compte, faites-vous entendre"
            description="Posez une question, racontez votre expérience ou laissez un message vocal, l'équipe lit tout en plateau."
            footer={{ left: 'SMS : +229 07 07 00 00 00', right: 'Coût normal opérateur' }}
          />
        </>
      )}

      {mode === 'radio' && (
      <>
      {/* HERO – clearly the player */}
      <div className="relative overflow-hidden mt-4">
        <ImageWithFallback src={liveShow.cover} alt={liveShow.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(15,10,31,0.92) 0%, rgba(15,10,31,0.78) 50%, rgba(255,59,48,0.6) 100%)' }} />
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#FF3B30]/40 blur-3xl" />

        <div className="relative px-5 pt-5 pb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#FF3B30]" style={{ borderRadius: 999 }}>
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full bg-white opacity-60 animate-ping" style={{ borderRadius: 999 }} />
                <span className="relative inline-flex w-2 h-2 bg-white" style={{ borderRadius: 999 }} />
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.16em' }}>EN DIRECT</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-md" style={{ borderRadius: 999 }}>
              <Headphones size={12} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700 }}>
                {listeners.toLocaleString('fr-FR')} à l'écoute
              </span>
            </div>
          </div>

          <div className="mt-4 inline-block px-2 py-0.5 bg-white/15 backdrop-blur-md" style={{ borderRadius: 4 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em' }}>
              {liveShow.category.toUpperCase()}
            </span>
          </div>
          <h2 className="mt-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {liveShow.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 opacity-90">
            <div className="w-7 h-7 bg-white/25 backdrop-blur-md flex items-center justify-center" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700 }}>
              {liveShow.hostInitials}
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 500 }}>
              Animé par {liveShow.host}
            </span>
          </div>

          {/* Time progress */}
          <div className="mt-5">
            <div className="relative h-1.5 bg-white/20" style={{ borderRadius: 999 }}>
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${progress}%`, borderRadius: 999 }} />
            </div>
            <div className="flex items-center justify-between mt-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
              <span>{liveShow.time} · +{elapsedMin}min</span>
              <span className="opacity-75">Fin · {liveShow.end}</span>
            </div>
          </div>

          {/* Player controls */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={toggleRadio}
              className="w-14 h-14 bg-white text-[#0F0A1F] flex items-center justify-center shadow-xl"
              style={{ borderRadius: 999 }}
              aria-label={radioPlaying ? 'Pause' : 'Lecture'}
            >
              {engine.loading && engine.src === RADIO_STREAM_URL ? <Loader2 size={22} className="animate-spin" /> : radioPlaying ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current ml-0.5" />}
            </button>
            <div className="flex-1 flex items-end gap-0.5 h-10">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-white/70"
                  style={{
                    height: `${30 + Math.abs(Math.sin((i + (radioPlaying ? Date.now() / 200 : 0)) * 0.6)) * 60}%`,
                    borderRadius: 2,
                    animation: radioPlaying ? `wave 1.2s ease-in-out ${i * 60}ms infinite` : undefined,
                  }}
                />
              ))}
            </div>
            <button className="w-10 h-10 bg-white/15 backdrop-blur-md flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Partager">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Animateur card */}
      <section className="px-5 mt-5">
        <div className="p-4 bg-[#FAFAFA] flex items-center gap-3" style={{ borderRadius: 14 }}>
          <div className="w-14 h-14 flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0066FF, #FF3FA4)', borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
            {liveShow.hostInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em' }}>
              ANIMATEUR EN ANTENNE
            </div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a' }}>{liveShow.host}</div>
            <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>Spécialiste {liveShow.category.toLowerCase()} · IPPOO depuis 2018</div>
          </div>
          <button className="px-3 py-1.5 bg-[#0066FF] text-white" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700 }}>
            Suivre
          </button>
        </div>
      </section>

      {/* Listener map */}
      <section className="px-5 mt-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Users size={15} className="text-[#0066FF]" />
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            Qui nous écoute en ce moment
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { z: 'Cotonou', n: 1280, c: '#0066FF' },
            { z: 'Parakou', n: 412, c: '#FF3FA4' },
            { z: 'Porto-Novo', n: 268, c: '#E8B21A' },
            { z: 'Sèmè-Kpodji', n: 184, c: '#9B51E0' },
            { z: 'Abomey', n: 142, c: '#FF6A00' },
            { z: 'Diaspora', n: 126, c: '#1a1a1a' },
          ].map((r) => (
            <div key={r.z} className="p-2.5 bg-white border border-[#F0F0F0]" style={{ borderRadius: 10 }}>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5" style={{ background: r.c, borderRadius: 999 }} />
                <span className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 600 }}>{r.z}</span>
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                {r.n.toLocaleString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <LiveAntenneCTA
        title="Appelez le standard ou envoyez un SMS"
        titleSize="1rem"
        labelSize="0.68rem"
      />

      {/* Up next strip */}
      <section className="px-5 mt-5">
        <div className="flex items-end justify-between mb-2.5">
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            Juste après
          </h3>
          <button onClick={() => setTab('grille')} className="text-[#0066FF] flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600 }}>
            Toute la grille <ChevronRight size={13} />
          </button>
        </div>
        <div className="space-y-2">
          {upNext.map((p) => (
            <div key={p.time} className="flex items-center gap-3 p-2.5 bg-[#FAFAFA]" style={{ borderRadius: 12 }}>
              <div className="w-12 h-12 overflow-hidden flex-shrink-0" style={{ borderRadius: 8 }}>
                <ImageWithFallback src={p.cover} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.78rem', color: '#0066FF' }}>{p.time}</span>
                  <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>· {p.category}</span>
                </div>
                <div className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>{p.title}</div>
                <div className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{p.host}</div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center bg-white border border-[#EAEAEE]" style={{ borderRadius: 999 }} aria-label="Me rappeler">
                <Bell size={13} className="text-[#0066FF]" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[60px] z-10 bg-white/95 backdrop-blur-xl mt-6 border-b border-[#F0F0F0]">
        <div className="px-5 flex gap-1">
          {([
            ['grille', t('live.tab.grid'), program.length],
            ['replay', t('live.tab.replay'), replays.length],
            ['alertes', t('live.tab.alerts'), alerts.length],
          ] as const).map(([k, l, n]) => {
            const a = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="relative py-3 px-2 flex items-center gap-1.5 transition-colors"
                style={{
                  color: a ? '#1a1a1a' : '#717182',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: a ? 700 : 500,
                }}
              >
                {l}
                <span className="px-1.5 py-0.5" style={{ background: a ? '#1a1a1a' : '#F4F4F6', color: a ? 'white' : '#717182', fontSize: '0.65rem', fontWeight: 700, borderRadius: 999 }}>
                  {n}
                </span>
                {a && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#1a1a1a]" />}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'grille' && (
        <section className="px-5 mt-4">
          <div className="space-y-1.5">
            {program.map((p) => {
              const isLive = !!p.live;
              return (
                <div
                  key={p.time}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: isLive ? 'rgba(255,59,48,0.06)' : 'transparent',
                    border: isLive ? '1px solid rgba(255,59,48,0.3)' : '1px solid transparent',
                    borderBottom: isLive ? '1px solid rgba(255,59,48,0.3)' : '1px solid #F4F4F6',
                    borderRadius: isLive ? 10 : 0,
                  }}
                >
                  <div className="flex flex-col items-center" style={{ width: 56 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: isLive ? '#FF3B30' : '#1a1a1a', letterSpacing: '-0.01em' }}>
                      {p.time}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: '#717182' }}>{p.end}</span>
                  </div>
                  <div className="w-10 h-10 overflow-hidden flex-shrink-0" style={{ borderRadius: 8 }}>
                    <ImageWithFallback src={p.cover} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>{p.title}</span>
                      {isLive && (
                        <span className="px-1.5 py-0.5 bg-[#FF3B30] text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.12em', borderRadius: 4 }}>
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{p.host} · {p.category}</div>
                  </div>
                  {isLive ? (
                    <button className="w-9 h-9 bg-[#FF3B30] text-white flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Écouter">
                      <Play size={14} className="fill-white ml-0.5" />
                    </button>
                  ) : (
                    <button className="w-9 h-9 bg-[#F4F4F6] flex items-center justify-center" style={{ borderRadius: 999 }} aria-label="Me rappeler">
                      <Bell size={14} className="text-[#0066FF]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'replay' && (
        <section className="px-5 mt-4">
          <div className="space-y-3">
            {replays.map((r) => (
              <button key={r.id} className="w-full flex gap-3 p-2.5 bg-white border border-[#F0F0F0] text-left" style={{ borderRadius: 12 }}>
                <div className="relative w-24 h-24 overflow-hidden flex-shrink-0" style={{ borderRadius: 8 }}>
                  <ImageWithFallback src={r.image} alt={r.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white flex items-center justify-center" style={{ borderRadius: 999 }}>
                      <Play size={14} className="text-[#1a1a1a] fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, borderRadius: 4 }}>
                    {r.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-1.5 py-0.5 bg-[#FAFAFA] mb-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, color: '#717182', letterSpacing: '0.1em', borderRadius: 4 }}>
                    REPLAY
                  </div>
                  <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#1a1a1a', lineHeight: 1.3 }}>{r.title}</h3>
                  <div className="text-[#717182] mt-1.5 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                    <span>{r.host}</span>
                    <span>·</span>
                    <span>{r.date}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Headphones size={10} /> {r.plays}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === 'alertes' && (
        <section className="px-5 mt-4 space-y-2.5">
          {alerts.map((a) => (
            <div key={a.zone} className="flex items-start gap-3 p-3.5 bg-[#FAFAFA]" style={{ borderRadius: 12, borderLeft: `3px solid ${a.tone}` }}>
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${a.tone}1A`, borderRadius: 999 }}>
                <Bell size={17} style={{ color: a.tone }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.88rem', color: '#1a1a1a' }}>{a.kind}</span>
                  <span className="px-1.5 py-0.5" style={{ background: a.tone, color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', borderRadius: 4 }}>
                    {a.zone.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 text-[#1a1a1a]/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', lineHeight: 1.4 }}>{a.desc}</div>
                <div className="text-[#717182] mt-1.5 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600 }}>
                  <Calendar size={11} /> {a.time}
                </div>
              </div>
            </div>
          ))}
          <div className="mt-3 p-4 bg-[#0066FF]/8 flex items-start gap-3" style={{ borderRadius: 12 }}>
            <div className="w-9 h-9 bg-[#0066FF] flex items-center justify-center flex-shrink-0" style={{ borderRadius: 999 }}>
              <Radio size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.88rem', color: '#1a1a1a' }}>
                Activer les alertes radio
              </div>
              <div className="mt-0.5 text-[#1a1a1a]/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
                Recevez une notification dès qu'une alerte est diffusée à l'antenne.
              </div>
            </div>
            <button className="px-3 py-1.5 bg-[#0066FF] text-white" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, borderRadius: 999 }}>
              Activer
            </button>
          </div>
        </section>
      )}

      </>
      )}

      <div style={{ height: 'calc(120px + env(safe-area-inset-bottom))' }} />

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </motion.div>
  );
}

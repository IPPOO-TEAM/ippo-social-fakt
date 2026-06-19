import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MessageCircle, Plus, Music2, Sparkles, ShieldCheck, X, Clock } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useToast } from '../Toast';
import {
  moodLabel, moodColor,
  type WellbeingTheme, type Mood, type WellbeingPost, type MusicTrack,
} from '../../data/wellbeing';
import { useWellbeing, useMoodLog } from '../../lib/wellbeing-store';
import { useResolvedThemes, useResolvedThemeMap } from '../../lib/admin-overrides';
import { useResource } from '../../admin/store';

interface Props {
  onBack: () => void;
  onOpenPost: (id: string) => void;
}

function MoodSlider({ value, onChange, label, lowLabel, highLabel, color }: {
  value: number; onChange: (v: number) => void; label: string; lowLabel: string; highLabel: string; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1a' }}>{label}</span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color }}>{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between mt-0.5" style={{ fontSize: '0.68rem', color: '#717182' }}>
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );
}

export function MoodCard({ mood, onChange, compact = false }: {
  mood: Mood; onChange: (m: Mood) => void; compact?: boolean;
}) {
  const c = moodColor(mood);
  return (
    <div
      className="p-4"
      style={{ background: `linear-gradient(135deg, ${c}14 0%, ${c}03 100%)`, border: `1px solid ${c}33`, borderRadius: 14 }}
    >
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c }}>
              Comment vous sentez-vous ?
            </div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              {moodLabel(mood)}
            </div>
          </div>
          <div className="px-3 py-1 text-white" style={{ background: c, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700 }}>
            Moyenne {((mood.calm + mood.energy) / 2).toFixed(1)}
          </div>
        </div>
      )}
      <div className="space-y-3">
        <MoodSlider value={mood.calm} onChange={(v) => onChange({ ...mood, calm: v })} label="Calme intérieur" lowLabel="Tendu·e" highLabel="Apaisé·e" color={c} />
        <MoodSlider value={mood.energy} onChange={(v) => onChange({ ...mood, energy: v })} label="Énergie" lowLabel="Épuisé·e" highLabel="Énergique" color={c} />
      </div>
    </div>
  );
}

function ComposerModal({ open, onClose, onSubmit }: {
  open: boolean; onClose: () => void; onSubmit: (p: Omit<WellbeingPost, 'id' | 'date'>) => void;
}) {
  const [theme, setTheme] = useState<WellbeingTheme>('famille');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [anon, setAnon] = useState(true);
  const [mood, setMood] = useState<Mood>({ calm: 5, energy: 5 });
  const themes = useResolvedThemes().filter((t) => !t.hidden);

  if (!open) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit({
      theme, title: title.trim(), body: body.trim(),
      author: anon || !author.trim() ? 'Anonyme' : author.trim(),
      anonymous: anon, moodBefore: mood,
    });
    setTitle(''); setBody(''); setAuthor(''); setAnon(true); setMood({ calm: 5, energy: 5 });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto p-5" style={{ borderRadius: '14px 14px 0 0' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>Partager ce qui vous traverse</div>
            <div className="text-[#717182] mt-0.5" style={{ fontSize: '0.78rem' }}>Anonyme par défaut. Bienveillance demandée.</div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center -mr-2 -mt-1"><X size={18} className="text-[#717182]" /></button>
        </div>

        <div className="mb-3">
          <div className="text-[#717182] mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Thème</div>
          <div className="flex flex-wrap gap-1.5">
            {themes.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                className="px-3 py-1.5"
                style={{
                  background: theme === t.key ? t.color : t.bg,
                  color: theme === t.key ? 'white' : '#1a1a1a',
                  borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                }}
              >
                <><t.icon size={13} className="inline -mt-0.5 mr-1" /> {t.label}</>
              </button>
            ))}
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Un titre court qui résume…"
          required
          className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none mb-2"
          style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Décrivez ce que vous ressentez ou ce qui vous préoccupe…"
          required
          rows={5}
          className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none mb-3 resize-y"
          style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
        />

        <div className="mb-3">
          <div className="text-[#717182] mb-2" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>État avant de poster</div>
          <MoodCard mood={mood} onChange={setMood} compact />
        </div>

        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="w-4 h-4" />
          <span style={{ fontSize: '0.82rem', color: '#1a1a1a' }}>Publier anonymement</span>
        </label>
        {!anon && (
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Pseudonyme affiché"
            className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none mb-2"
            style={{ borderRadius: 10, fontSize: '0.88rem' }}
          />
        )}

        <button type="submit" className="w-full py-3 mt-2 text-white" style={{ background: '#0066FF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem', borderRadius: 999 }}>
          Publier sur le mur
        </button>
      </form>
    </div>
  );
}

export function BienEtreView({ onBack, onOpenPost }: Props) {
  const toast = useToast();
  const { posts, addPost, responsesFor } = useWellbeing();
  const { items: tracks } = useResource<MusicTrack>('tracks');
  const { entries, log } = useMoodLog();
  const themes = useResolvedThemes().filter((t) => !t.hidden);
  const themeMap = useResolvedThemeMap();
  const [tab, setTab] = useState<'mur' | 'musiques'>('mur');
  const [filter, setFilter] = useState<WellbeingTheme | 'all'>('all');
  const [mood, setMood] = useState<Mood>(() => {
    const last = entries[entries.length - 1];
    return last ? { calm: last.calm, energy: last.energy } : { calm: 5, energy: 5 };
  });
  const [composer, setComposer] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filter === 'all' ? posts : posts.filter((p) => p.theme === filter),
    [posts, filter],
  );

  const recommendedTracks = useMemo(() => {
    if (filter === 'all') return tracks.slice(0, 4);
    return tracks.filter((t) => t.themes.includes(filter as WellbeingTheme));
  }, [tracks, filter]);

  const submitMood = () => {
    log(mood);
    toast(`État noté : ${moodLabel(mood)}. À refaire après lecture pour mesurer l'effet.`);
  };

  const submitPost = (p: Omit<WellbeingPost, 'id' | 'date'>) => {
    const post: WellbeingPost = { ...p, id: `we-${Date.now()}`, date: 'à l\'instant' };
    addPost(post);
    setComposer(false);
    toast('Votre message est publié sur le mur. La communauté répondra avec bienveillance.');
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label="Retour" style={{ borderRadius: 10 }}>
          <ChevronLeft size={20} className="text-[#1a1a1a]" />
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          Espace Bien-Être
        </h1>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Mur d'écoute bienveillante
        </div>
        <h2 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          Déposer, écouter, s'apaiser.
        </h2>
        <p className="mt-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Un espace humain. On y partage des inquiétudes, des réflexions, des morceaux de vie. La communauté répond avec son vécu, pas pour juger, juste pour comprendre, accompagner et aider.
        </p>

        <div className="mt-4 p-3 flex items-start gap-2.5" style={{ background: '#F4F4F6', borderRadius: 12 }}>
          <ShieldCheck size={16} className="text-[#0066FF] mt-0.5 flex-shrink-0" />
          <div style={{ fontSize: '0.78rem', color: '#1a1a1a', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700 }}>Charte :</span> uniquement des sujets humains, sociaux ou émotionnels.
            Pas de politique, pas d'économie. Bienveillance, écoute et respect.
          </div>
        </div>

        <div className="mt-5">
          <MoodCard mood={mood} onChange={setMood} />
          <button
            onClick={submitMood}
            className="mt-2 w-full py-2.5 bg-[#1a1a1a] text-white"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: 999 }}
          >
            Enregistrer mon état · {moodLabel(mood)}
          </button>
          {entries.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[#717182]" style={{ fontSize: '0.74rem' }}>
              <Clock size={12} /> {entries.length} relevé{entries.length > 1 ? 's' : ''} dans votre journal.
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-1 p-1 bg-[#F4F4F6]" style={{ borderRadius: 999, width: 'fit-content' }}>
          {(['mur', 'musiques'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-4 py-1.5 transition-colors"
              style={{
                background: tab === k ? 'white' : 'transparent',
                color: tab === k ? '#1a1a1a' : '#717182',
                fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                borderRadius: 999,
                boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {k === 'mur' ? 'Le mur' : 'Musiques'}
            </button>
          ))}
        </div>

        <div className="mt-4 -mx-5 px-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-1.5 w-max">
            <button
              onClick={() => setFilter('all')}
              className="px-3 py-1.5 flex-shrink-0"
              style={{
                background: filter === 'all' ? '#1a1a1a' : '#F4F4F6',
                color: filter === 'all' ? 'white' : '#1a1a1a',
                borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
              }}
            >
              Tous
            </button>
            {themes.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="px-3 py-1.5 flex-shrink-0"
                style={{
                  background: filter === t.key ? t.color : t.bg,
                  color: filter === t.key ? 'white' : '#1a1a1a',
                  borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                }}
              >
                <><t.icon size={13} className="inline -mt-0.5 mr-1" /> {t.label}</>
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'mur' && (
        <div className="px-5 mt-4 pb-32 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[#717182]" style={{ fontSize: '0.85rem' }}>
              Aucun message pour ce thème. Soyez le premier à partager.
            </div>
          )}
          {filtered.map((p) => {
            const meta = themeMap[p.theme];
            const respCount = responsesFor(p.id).length;
            const delta = p.moodAfter
              ? ((p.moodAfter.calm + p.moodAfter.energy) / 2) - ((p.moodBefore.calm + p.moodBefore.energy) / 2)
              : null;
            return (
              <button
                key={p.id}
                onClick={() => onOpenPost(p.id)}
                className="w-full text-left bg-white border border-[#F0F0F0] hover:border-[#0066FF]/40 transition-colors overflow-hidden"
                style={{ borderRadius: 14 }}
              >
                {p.image && (
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                    <ImageWithFallback src={p.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)' }} />
                    <span className="absolute top-3 left-3 px-2.5 py-1" style={{ background: meta.bg, color: meta.color, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                      <><meta.icon size={13} className="inline -mt-0.5 mr-1" /> {meta.label}</>
                    </span>
                  </div>
                )}
                <div className="p-4">
                  {!p.image && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1" style={{ background: meta.bg, color: meta.color, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                        <><meta.icon size={13} className="inline -mt-0.5 mr-1" /> {meta.label}</>
                      </span>
                      <span className="text-[#717182]" style={{ fontSize: '0.7rem' }}>{p.date}</span>
                    </div>
                  )}
                  {p.image && (
                    <div className="mb-1.5 text-[#717182]" style={{ fontSize: '0.7rem' }}>{p.date}</div>
                  )}
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                    {p.title}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-[#1a1a1a]/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.45 }}>
                    {p.body}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#717182]" style={{ fontSize: '0.74rem' }}>
                      <span>{p.author}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} /> {respCount}</span>
                    </div>
                    {delta !== null && (
                      <span
                        className="px-2 py-0.5"
                        style={{
                          background: delta >= 0 ? '#D4F4E0' : '#FFE0F2',
                          color: delta >= 0 ? '#00A03B' : '#D02F87',
                          borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                        }}
                      >
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)} après lecture
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'musiques' && (
        <div className="px-5 mt-4 pb-32">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#9B51E0]" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1a' }}>
              Composées à partir des thèmes les plus partagés
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recommendedTracks.map((t) => (
              <div key={t.id} className="bg-white border border-[#F0F0F0]" style={{ borderRadius: 14 }}>
                <div className="relative aspect-square overflow-hidden" style={{ borderRadius: '14px 14px 0 0' }}>
                  <ImageWithFallback src={t.image} alt={t.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <div className="flex items-center gap-1" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>
                      <Music2 size={11} /> {t.mood}
                    </div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                      {t.title}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.themes.map((th) => {
                      const tm = themeMap[th];
                      return <span key={th} className="px-1.5 py-0.5" style={{ background: tm.bg, color: tm.color, borderRadius: 999, fontSize: '0.65rem', fontWeight: 600 }}>{tm.label}</span>;
                    })}
                  </div>
                  {t.audio ? (
                    playingId === t.id ? (
                      <audio
                        src={t.audio}
                        controls
                        autoPlay
                        onEnded={() => setPlayingId(null)}
                        className="w-full"
                        style={{ height: 32 }}
                      />
                    ) : (
                      <button
                        onClick={() => setPlayingId(t.id)}
                        className="w-full py-1.5 bg-[#1a1a1a] text-white"
                        style={{ fontSize: '0.78rem', fontWeight: 700, borderRadius: 999 }}
                      >
                        ▶ {t.duration}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => toast(`Aucun fichier audio attaché à « ${t.title} ». Ajoutez-en un depuis l'admin.`)}
                      className="w-full py-1.5 bg-[#F4F4F6] text-[#717182]"
                      style={{ fontSize: '0.78rem', fontWeight: 600, borderRadius: 999 }}
                    >
                      Bientôt · {t.duration}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {recommendedTracks.length === 0 && (
              <div className="col-span-2 text-center py-6 text-[#717182]" style={{ fontSize: '0.85rem' }}>
                Aucune musique pour ce thème pour l'instant.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setComposer(true)}
        className="fixed bottom-5 right-5 z-[58] w-14 h-14 bg-[#0066FF] text-white flex items-center justify-center shadow-xl"
        style={{ borderRadius: 999, boxShadow: '0 10px 30px -10px rgba(0,102,255,0.6)' }}
        aria-label="Partager"
      >
        <Plus size={22} strokeWidth={2.6} />
      </button>

      <ComposerModal open={composer} onClose={() => setComposer(false)} onSubmit={submitPost} />
    </motion.div>
  );
}

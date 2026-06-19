import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Heart, Flag, ThumbsUp } from 'lucide-react';
import { useToast } from '../Toast';
import { MoodCard } from './BienEtreView';
import {
  responseKindMeta, moodLabel, moodColor,
  type Mood, type ResponseKind, type WellbeingPost, type WellbeingResponse,
} from '../../data/wellbeing';
import { useWellbeing } from '../../lib/wellbeing-store';
import { useResolvedThemeMap } from '../../lib/admin-overrides';

interface Props {
  post: WellbeingPost;
  onBack: () => void;
}

export function BienEtrePost({ post, onBack }: Props) {
  const toast = useToast();
  const { responsesFor, helpful, addResponse, toggleHelpful, setMoodAfter } = useWellbeing();
  const themeMap = useResolvedThemeMap();
  const meta = themeMap[post.theme];
  const [kind, setKind] = useState<ResponseKind>('support');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [moodAfter, setMoodAfterLocal] = useState<Mood>(post.moodAfter ?? { calm: post.moodBefore.calm, energy: post.moodBefore.energy });
  const [moodSaved, setMoodSaved] = useState(!!post.moodAfter);

  const responses = responsesFor(post.id);
  const grouped = useMemo(() => {
    const g: Record<ResponseKind, WellbeingResponse[]> = { support: [], experience: [], critique: [] };
    responses.forEach((r) => g[r.kind].push(r));
    return g;
  }, [responses]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addResponse({
      id: `r-${Date.now()}`,
      postId: post.id,
      author: author.trim() || 'Anonyme',
      kind,
      body: body.trim(),
      date: 'à l\'instant',
      helpful: 0,
    });
    setBody(''); setAuthor('');
    toast('Merci pour votre réponse bienveillante.');
  };

  const saveMoodAfter = () => {
    setMoodAfter(post.id, moodAfter);
    setMoodSaved(true);
    const before = (post.moodBefore.calm + post.moodBefore.energy) / 2;
    const after = (moodAfter.calm + moodAfter.energy) / 2;
    const delta = after - before;
    toast(delta >= 0
      ? `Vous avez gagné ${delta.toFixed(1)} point${Math.abs(delta) > 1 ? 's' : ''} de sérénité.`
      : `Cela a réveillé quelque chose. N'hésitez pas à consulter un praticien dans Espace Bien-Être.`);
  };

  const beforeAvg = (post.moodBefore.calm + post.moodBefore.energy) / 2;
  const beforeColor = moodColor(post.moodBefore);

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
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1" style={{ background: meta.bg, color: meta.color, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
            <><meta.icon size={13} className="inline -mt-0.5 mr-1" /> {meta.label}</>
          </span>
          <span className="text-[#717182]" style={{ fontSize: '0.7rem' }}>{post.date}</span>
        </div>
      </div>

      <div className="px-5 pt-5">
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.55rem', color: '#1a1a1a', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
          {post.title}
        </h1>
        <div className="mt-1 text-[#717182]" style={{ fontSize: '0.78rem' }}>{post.author}</div>
        <p className="mt-3 text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {post.body}
        </p>

        <div className="mt-4 flex items-center justify-between p-3" style={{ background: `${beforeColor}10`, border: `1px solid ${beforeColor}33`, borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: beforeColor }}>
              État au moment de poster
            </div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
              {moodLabel(post.moodBefore)} · {beforeAvg.toFixed(1)}/10
            </div>
          </div>
          <button
            onClick={() => toast('Signalement transmis à la modération.')}
            className="w-9 h-9 bg-white border border-[#EAEAEE] flex items-center justify-center text-[#717182] hover:text-[#D32F2F]"
            style={{ borderRadius: 999 }}
            title="Signaler"
          >
            <Flag size={14} />
          </button>
        </div>

        <h2 className="mt-7 mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          Réponses de la communauté · {responses.length}
        </h2>

        {(['support', 'experience', 'critique'] as const).map((k) => {
          const list = grouped[k];
          if (list.length === 0) return null;
          const km = responseKindMeta[k];
          return (
            <div key={k} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1" style={{ background: km.bg, color: km.color, borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                  {km.label}
                </span>
                <span className="text-[#717182]" style={{ fontSize: '0.72rem' }}>{km.hint}</span>
              </div>
              <div className="space-y-2">
                {list.map((r) => {
                  const liked = helpful.includes(r.id);
                  return (
                    <div key={r.id} className="bg-[#FAFAFA] p-3" style={{ borderRadius: 12 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a' }}>{r.author}</span>
                        <span className="text-[#717182]" style={{ fontSize: '0.7rem' }}>{r.date}</span>
                      </div>
                      <p className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {r.body}
                      </p>
                      <button
                        onClick={() => toggleHelpful(r.id)}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1"
                        style={{
                          background: liked ? '#D4F4E0' : 'white',
                          border: `1px solid ${liked ? '#00C853' : '#EAEAEE'}`,
                          color: liked ? '#00A03B' : '#1a1a1a',
                          borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                        }}
                      >
                        <ThumbsUp size={11} /> {liked ? "M'a aidé" : "Ça m'aide"} · {r.helpful}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {responses.length === 0 && (
          <div className="text-center py-8 text-[#717182]" style={{ fontSize: '0.85rem' }}>
            Aucune réponse pour l'instant. Soyez la première voix.
          </div>
        )}

        <div className="mt-6 p-4 bg-[#F4F4F6]" style={{ borderRadius: 14 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            {moodSaved ? 'État après lecture (mis à jour)' : 'Comment vous sentez-vous maintenant ?'}
          </div>
          <div className="text-[#717182] mt-0.5 mb-3" style={{ fontSize: '0.78rem' }}>
            Mesurer l'effet des échanges sur votre tension intérieure.
          </div>
          <MoodCard mood={moodAfter} onChange={setMoodAfterLocal} compact />
          <button
            onClick={saveMoodAfter}
            className="mt-2 w-full py-2.5 bg-[#1a1a1a] text-white"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: 999 }}
          >
            {moodSaved ? 'Mettre à jour mon état' : `Enregistrer · ${moodLabel(moodAfter)}`}
          </button>
        </div>

        <h3 className="mt-7 mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          Répondre avec bienveillance
        </h3>
        <form onSubmit={submit} className="space-y-2 pb-10">
          <div className="flex flex-wrap gap-1.5">
            {(['support', 'experience', 'critique'] as const).map((k) => {
              const km = responseKindMeta[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className="px-3 py-1.5"
                  style={{
                    background: kind === k ? km.color : km.bg,
                    color: kind === k ? 'white' : '#1a1a1a',
                    borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                  }}
                >
                  {km.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Une expérience, un conseil, une parole rassurante…"
            required
            rows={4}
            className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none resize-y"
            style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Pseudonyme (laisser vide pour anonyme)"
            className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent focus:border-[#0066FF] outline-none"
            style={{ borderRadius: 10, fontSize: '0.88rem' }}
          />
          <button
            type="submit"
            className="w-full py-3 mt-1 text-white inline-flex items-center justify-center gap-1.5"
            style={{ background: '#0066FF', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.92rem', borderRadius: 999 }}
          >
            <Heart size={14} /> Publier la réponse
          </button>
        </form>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { ThumbsUp, Heart, Hand, Sparkles, Frown, Flame, Smile } from 'lucide-react';
import { useEmojiReactions, REACTION_TYPES, REACTION_LABEL, REACTION_COLOR, type ReactionType } from '../lib/storage';

interface Props {
  targetId: string;
  accent?: string;
}

const ICONS: Record<ReactionType, typeof ThumbsUp> = {
  like: ThumbsUp,
  love: Heart,
  clap: Hand,
  wow: Sparkles,
  sad: Frown,
  angry: Flame,
};

function ReactionIcon({ type, size = 18, filled = false }: { type: ReactionType; size?: number; filled?: boolean }) {
  const Icon = ICONS[type];
  const color = REACTION_COLOR[type];
  return (
    <Icon
      size={size}
      style={{ color: filled ? color : '#1a1a1a' }}
      className={filled ? 'fill-current' : ''}
    />
  );
}

export function ReactionBar({ targetId, accent = '#0066FF' }: Props) {
  const { mine, counts, total, top, set } = useEmojiReactions(targetId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const onPick = (t: ReactionType) => {
    set(t);
    setPickerOpen(false);
  };

  return (
    <div className="bg-[#FAFAFA] p-4" style={{ borderRadius: 'var(--r-md)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center -space-x-1.5">
            {top.map((t) => (
              <div key={t} className="w-7 h-7 bg-white flex items-center justify-center shadow-sm" style={{ borderRadius: 999, border: '1.5px solid white' }}>
                <ReactionIcon type={t} size={14} filled />
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.92rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              {total.toLocaleString('fr-FR')} réactions
            </div>
            <div className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
              {mine ? `Vous · ${REACTION_LABEL[mine]}` : 'Soyez le premier à réagir'}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            style={{
              background: mine ? accent : 'white',
              color: mine ? 'white' : '#1a1a1a',
              border: mine ? 'none' : '1px solid #EAEAEE',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: 999,
            }}
          >
            {mine ? (
              <ReactionIcon type={mine} size={15} filled={false} />
            ) : (
              <Smile size={15} />
            )}
            <span style={{ color: mine ? 'white' : '#1a1a1a' }}>{mine ? REACTION_LABEL[mine] : 'Réagir'}</span>
          </button>

          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
              <div className="absolute right-0 bottom-full mb-2 z-30 bg-white shadow-xl flex items-center gap-1 px-2 py-1.5" style={{ borderRadius: 999, border: '1px solid #EAEAEE' }}>
                {REACTION_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => onPick(t)}
                    className="w-9 h-9 flex items-center justify-center transition-transform hover:scale-125 active:scale-110"
                    style={{ borderRadius: 999, background: mine === t ? '#F4F4F6' : 'transparent' }}
                    title={REACTION_LABEL[t]}
                  >
                    <ReactionIcon type={t} size={20} filled />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5 mt-3">
        {REACTION_TYPES.map((t) => {
          const active = mine === t;
          const color = REACTION_COLOR[t];
          return (
            <button
              key={t}
              onClick={() => set(t)}
              className="flex flex-col items-center gap-0.5 py-2 transition-colors"
              style={{
                background: active ? 'white' : 'transparent',
                border: active ? `1.5px solid ${accent}` : '1.5px solid transparent',
                borderRadius: 8,
              }}
            >
              <ReactionIcon type={t} size={18} filled={active} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: active ? color : '#717182' }}>
                {counts[t]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

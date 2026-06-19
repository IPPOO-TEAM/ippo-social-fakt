import { useState } from 'react';
import { Heart, Send, MessageCircle, Trash2 } from 'lucide-react';
import { useComments } from '../lib/storage';

interface Props { targetId: string; accent?: string; }

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function Comments({ targetId, accent = '#0066FF' }: Props) {
  const { list, count, add, toggleLike, remove } = useComments(targetId);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    add(name, text);
    setText('');
  };

  return (
    <section className="border-t border-[#F0F0F0] mt-2 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={18} className="text-[#1a1a1a]"/>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          Commentaires
        </h2>
        <span className="px-2 py-0.5 bg-[#FAFAFA] text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700 }}>
          {count}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#FAFAFA] p-3 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre prénom (optionnel)"
          className="w-full px-3 py-2 bg-white border-0 outline-none mb-2"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Partager votre avis…"
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 bg-white border-0 outline-none resize-none"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.5 }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
            {text.length}/500
          </span>
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2 text-white flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: accent, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.8rem' }}
          >
            <Send size={13}/> Publier
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <div className="text-center py-6 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
          Soyez le premier à commenter.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((c) => {
            const isMine = !['Aïcha D.', 'Mamadou B.', 'Fatou N.'].includes(c.author) && c.id.startsWith('c-');
            return (
              <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15`, borderRadius: 999 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.82rem', color: accent }}>
                    {c.author[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#1a1a1a' }}>{c.author}</span>
                    <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>· {relTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    {c.text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(c.id)}
                      className="flex items-center gap-1 text-[#717182] hover:text-[#FF3B30] transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      <Heart size={13} className={c.liked ? 'fill-[#FF3B30] text-[#FF3B30]' : ''}/>
                      {c.likes > 0 && <span className={c.liked ? 'text-[#FF3B30]' : ''}>{c.likes}</span>}
                    </button>
                    {isMine && (
                      <button
                        onClick={() => remove(c.id)}
                        className="text-[#717182] hover:text-[#FF3B30]"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

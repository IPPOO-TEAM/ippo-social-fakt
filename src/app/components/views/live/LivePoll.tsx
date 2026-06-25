import { memo, useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { fetchPoll, votePoll } from '../../../lib/api';
import { useUser } from '../../../lib/user';
import { useRealtime } from '../../../lib/realtime';
import { emitToast } from '../../Toast';

export interface PollOption { id: string; label: string; }

interface Props {
  pollId: string;
  question: string;
  options: PollOption[];
}

export const LivePoll = memo(function LivePoll({ pollId, question, options }: Props) {
  const { user } = useUser();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const r = await fetchPoll(pollId);
      setCounts(r.counts ?? {});
      setVoted(r.mine ?? null);
    } catch {
      setCounts({}); setVoted(null);
    }
  }, [pollId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchPoll(pollId);
        if (cancelled) return;
        setCounts(r.counts ?? {});
        setVoted(r.mine ?? null);
      } catch {
        if (!cancelled) { setCounts({}); setVoted(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [pollId]);

  // Temps réel : les votes des autres participants animent les barres en direct.
  useRealtime('poll_votes', `poll_id=eq.${pollId}`, reload, !!pollId);

  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  const onVote = async (optionId: string) => {
    if (voted || busy) return;
    if (!user.authed) {
      emitToast('Connectez-vous pour voter.', 'error');
      return;
    }
    setBusy(true);
    const prev = voted;
    setVoted(optionId);
    setCounts((m) => ({ ...m, [optionId]: (m[optionId] ?? 0) + 1 }));
    try {
      await votePoll(pollId, optionId);
      const r = await fetchPoll(pollId);
      setCounts(r.counts ?? {});
      setVoted(r.mine ?? optionId);
    } catch (e) {
      setVoted(prev);
      setCounts((m) => {
        const next = { ...m };
        next[optionId] = Math.max(0, (next[optionId] ?? 1) - 1);
        return next;
      });
      emitToast(e instanceof Error ? e.message : 'Vote impossible', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="px-5 mt-6">
      <div className="p-4 bg-gradient-to-br from-[#0066FF]/10 to-[#FF3FA4]/10 border border-[#0066FF]/20" style={{ borderRadius: 14 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-[#0066FF]" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em', color: '#0066FF' }}>SONDAGE EN COURS</span>
          </div>
          <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
            {totalVotes.toLocaleString('fr-FR')} votes
          </span>
        </div>
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {question}
        </h3>
        <div className="space-y-2 mt-3">
          {options.map((o) => {
            const count = counts[o.id] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const picked = voted === o.id;
            return (
              <button
                key={o.id}
                onClick={() => void onVote(o.id)}
                disabled={!!voted || busy}
                className="relative w-full overflow-hidden bg-white border text-left"
                style={{ borderColor: picked ? '#0066FF' : '#EAEAEE', borderRadius: 10 }}
              >
                {voted && (
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${pct}%`, background: picked ? 'rgba(0,102,255,0.15)' : 'rgba(0,0,0,0.04)' }}
                  />
                )}
                <div className="relative flex items-center justify-between px-3 py-2.5">
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: picked ? 700 : 500, fontSize: '0.85rem', color: '#1a1a1a' }}>
                    {o.label}
                  </span>
                  {voted && (
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: picked ? '#0066FF' : '#717182' }}>
                      {pct}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {!voted && (
          <div className="text-[#717182] mt-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
            {user.authed ? 'Votre vote reste anonyme.' : 'Connectez-vous pour voter.'}
          </div>
        )}
      </div>
    </section>
  );
});

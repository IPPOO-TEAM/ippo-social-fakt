import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Btn } from './ui';
import { useAdminToast } from './AdminToast';
import {
  adminListComments, moderateComment,
  type CommentStatus, type ServerComment,
} from '../lib/api';

const STATUSES: { key: CommentStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Approuvés' },
  { key: 'rejected', label: 'Rejetés' },
  { key: 'all', label: 'Tous' },
];

function statusOf(c: ServerComment): CommentStatus {
  return c.status ?? 'approved';
}

function StatusBadge({ status }: { status: CommentStatus }) {
  const palette: Record<CommentStatus, { bg: string; fg: string; label: string }> = {
    pending: { bg: '#FFF6D9', fg: '#7C5400', label: 'En attente' },
    approved: { bg: '#E6F4EA', fg: '#1E7A36', label: 'Approuvé' },
    rejected: { bg: '#FFE5E5', fg: '#D32F2F', label: 'Rejeté' },
  };
  const p = palette[status];
  return (
    <span style={{ background: p.bg, color: p.fg, padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
      {p.label}
    </span>
  );
}

export function AdminModeration() {
  const { show } = useAdminToast();
  const [filter, setFilter] = useState<CommentStatus | 'all'>('pending');
  const [items, setItems] = useState<ServerComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async (status: CommentStatus | 'all') => {
    setLoading(true);
    try {
      const { items: list } = await adminListComments(status === 'all' ? undefined : status);
      setItems(list);
    } catch (e) {
      console.log('AdminModeration load failed:', e);
      show('Chargement impossible — vérifiez la console.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(filter); }, [filter]);

  const counts = useMemo(() => {
    // Hint only — exact counts would need a separate roundtrip per status.
    return items.length;
  }, [items]);

  const setStatus = async (c: ServerComment, next: CommentStatus) => {
    setUpdating(c.id);
    const prev = items;
    setItems((cur) => cur.map((x) => x.id === c.id ? { ...x, status: next } : x));
    try {
      await moderateComment(c.targetId, c.id, next);
      show(`Commentaire ${next === 'approved' ? 'approuvé' : next === 'rejected' ? 'rejeté' : 'remis en attente'}`, 'success');
      // If we're viewing a filtered list, the item now belongs to a
      // different bucket — drop it from view so the queue stays accurate.
      if (filter !== 'all' && filter !== next) {
        setItems((cur) => cur.filter((x) => x.id !== c.id));
      }
    } catch (e) {
      console.log('moderateComment failed:', e);
      setItems(prev);
      show('Échec de la modération — réessayez.', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Modération"
        subtitle={loading ? 'Chargement…' : `${counts} commentaire${counts > 1 ? 's' : ''}`}
        actions={<Btn onClick={() => void load(filter)}>Actualiser</Btn>}
      />
      <div className="p-8">
        <div className="flex items-center gap-2 mb-5">
          {STATUSES.map((s) => {
            const active = filter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className="px-3 py-1.5"
                style={{
                  background: active ? '#0066FF' : '#F2F2F5',
                  color: active ? 'white' : '#1a1a1a',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {!loading && items.length === 0 && (
          <div className="bg-white border border-[#EAEAEE] p-8 text-center" style={{ borderRadius: 12, color: '#717182' }}>
            Rien à modérer dans cette file.
          </div>
        )}

        <div className="space-y-3">
          {items.map((c) => {
            const st = statusOf(c);
            const busy = updating === c.id;
            return (
              <div key={c.id} className="bg-white border border-[#EAEAEE] p-4" style={{ borderRadius: 12 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.author}</span>
                      <StatusBadge status={st} />
                      <span style={{ color: '#717182', fontSize: '0.72rem' }}>
                        cible <code style={{ background: '#F4F4F6', padding: '1px 4px', borderRadius: 4 }}>{c.targetId}</code>
                      </span>
                      <span style={{ color: '#717182', fontSize: '0.72rem' }}>
                        {new Date(c.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap" style={{ fontSize: '0.92rem', color: '#1a1a1a' }}>{c.text}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {st !== 'approved' && (
                      <Btn variant="primary" disabled={busy} onClick={() => void setStatus(c, 'approved')}>Approuver</Btn>
                    )}
                    {st !== 'rejected' && (
                      <Btn disabled={busy} onClick={() => void setStatus(c, 'rejected')}>Rejeter</Btn>
                    )}
                    {st !== 'pending' && (
                      <Btn disabled={busy} onClick={() => void setStatus(c, 'pending')}>Remettre en attente</Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

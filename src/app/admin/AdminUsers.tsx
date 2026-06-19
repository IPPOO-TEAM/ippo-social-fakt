import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Btn, exportCsv } from './ui';
import { Mail, MapPin, Loader2 } from 'lucide-react';
import { useAdminToast } from './AdminToast';
import { adminListUsers, api } from '../lib/api';

interface ServerProfile {
  id: string;
  email?: string;
  firstName?: string;
  phone?: string;
  zone?: string;
  language?: string;
  role?: 'user' | 'editor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

type AdminUserRow = ServerProfile & {
  name: string;
  joined: string;
};

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: '#FFE5EC', color: '#D32F2F', label: 'Admin' },
  editor: { bg: '#E3F2FD', color: '#0066FF', label: 'Éditeur' },
  user: { bg: '#F2F2F5', color: '#717182', label: 'Membre' },
};

function relativeTime(iso?: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const diff = Date.now() - t;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `il y a ${d} j`;
  if (d < 31) return `il y a ${Math.round(d / 7)} sem`;
  if (d < 365) return `il y a ${Math.round(d / 30)} mois`;
  return `il y a ${Math.round(d / 365)} an${Math.round(d / 365) > 1 ? 's' : ''}`;
}

function fullName(p: ServerProfile): string {
  if (p.firstName && p.firstName.trim()) return p.firstName.trim();
  if (p.email) return p.email.split('@')[0];
  return p.id.slice(0, 8);
}

async function setUserRole(id: string, role: 'user' | 'editor' | 'admin') {
  return api(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'PUT', body: { role } });
}

export function AdminUsers() {
  const { show } = useAdminToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminListUsers({ limit: 200 });
      const raw = (res.items ?? res.users ?? []) as ServerProfile[];
      const rows: AdminUserRow[] = raw.map((p) => ({
        ...p,
        name: fullName(p),
        joined: relativeTime(p.createdAt),
      }));
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? users.filter((u) => (u.name + (u.email ?? '') + (u.zone ?? '')).toLowerCase().includes(q)) : users;
  }, [users, search]);

  const onRole = async (u: AdminUserRow, role: 'user' | 'editor' | 'admin') => {
    setBusyId(u.id);
    try {
      await setUserRole(u.id, role);
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role } : p)));
      show(`${u.name} → ${ROLE_STYLE[role].label}`, 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Échec mise à jour', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    editors: users.filter((u) => u.role === 'editor').length,
    members: users.filter((u) => (u.role ?? 'user') === 'user').length,
  };

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle={`${users.length} comptes Supabase`} />
      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: counts.total, color: '#0066FF' },
            { label: 'Admins', value: counts.admins, color: '#D32F2F' },
            { label: 'Éditeurs', value: counts.editors, color: '#0066FF' },
            { label: 'Membres', value: counts.members, color: '#717182' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#EAEAEE] p-4" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#717182', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <Toolbar
          search={search} onSearch={setSearch}
          onReset={() => void load()}
          onExport={() => exportCsv('utilisateurs', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Nom' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Téléphone' },
            { key: 'zone', label: 'Zone' },
            { key: 'role', label: 'Rôle' },
            { key: 'joined', label: 'Inscription' },
          ])}
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[#717182]">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : error ? (
          <div className="bg-[#FEEAEA] text-[#D32F2F] p-4" style={{ borderRadius: 8, fontSize: '0.85rem' }}>
            {error}
          </div>
        ) : (
          <Table<AdminUserRow>
            rows={filtered}
            columns={[
              {
                key: 'name', label: 'Utilisateur',
                render: (u) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-[#0066FF] text-white" style={{ borderRadius: '50%', fontWeight: 700, fontSize: '0.8rem' }}>
                      {u.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: '#717182' }}>
                        <Mail size={11} /> {u.email ?? '—'}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'zone', label: 'Zone',
                render: (u) => <div className="flex items-center gap-1" style={{ fontSize: '0.8rem' }}><MapPin size={11} className="text-[#717182]" /> {u.zone ?? '—'}</div>,
                width: '160px',
              },
              { key: 'joined', label: 'Inscription', render: (u) => <span style={{ fontSize: '0.78rem', color: '#717182' }}>{u.joined}</span>, width: '130px' },
              {
                key: 'role', label: 'Rôle',
                render: (u) => {
                  const s = ROLE_STYLE[u.role ?? 'user'] ?? ROLE_STYLE.user;
                  return <span className="px-2 py-0.5" style={{ background: s.bg, color: s.color, fontSize: '0.72rem', fontWeight: 600, borderRadius: 4 }}>{s.label}</span>;
                },
                width: '110px',
              },
              {
                key: 'actions', label: '',
                render: (u) => {
                  const role = u.role ?? 'user';
                  const busy = busyId === u.id;
                  return (
                    <div className="flex gap-1">
                      {role !== 'admin' && <Btn onClick={() => void onRole(u, 'admin')} disabled={busy}>→ Admin</Btn>}
                      {role !== 'editor' && <Btn onClick={() => void onRole(u, 'editor')} disabled={busy}>→ Éditeur</Btn>}
                      {role !== 'user' && <Btn variant="danger" onClick={() => void onRole(u, 'user')} disabled={busy}>Rétrograder</Btn>}
                    </div>
                  );
                },
                width: '260px',
              },
            ]}
          />
        )}
      </div>
    </>
  );
}

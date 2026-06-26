import { useMemo, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { useAdminToast, ConfirmDialog } from './AdminToast';
import { useResource, type Program } from './store';
import { seedPrograms } from '../data/programs';
import { STORAGE_KEYS, safeStorage } from '../lib/storage-safe';

// Re-exports kept for backwards compatibility with existing consumers.
export type { Program };
export { seedPrograms };
export const KEY_PROGRAMS = STORAGE_KEYS.adminPrograms;
export function loadPrograms(): Program[] {
  return safeStorage.get<Program[]>(KEY_PROGRAMS, seedPrograms);
}

const CATEGORIES = ['Magazine', 'Info', 'Économie', 'Société', 'Santé', 'Jeunesse', 'Débat', 'Podcast', 'Culture', 'Sport'];

const empty = (): Program => ({
  id: `pg-${Date.now()}`,
  time: '08:00', end: '09:00',
  title: '', host: '', hostInitials: '', category: 'Magazine',
  cover: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80',
});

export function AdminPrograms() {
  const { show } = useAdminToast();
  const { items, create, update, remove, reset } = useResource<Program>('programs');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Program | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Program, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const sorted = useMemo(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? sorted.filter((p) => (p.title + p.host + p.category).toLowerCase().includes(q)) : sorted;
  }, [sorted, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof Program, string>> = {};
    if (!editing.title.trim()) er.title = 'Titre requis.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const initials = editing.hostInitials.trim() || editing.host.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    const next = { ...editing, hostInitials: initials };
    const isUpdate = items.some((p) => p.id === next.id);
    if (isUpdate) void update(next.id, next); else void create(next);
    setEditing(null); setErrors({});
    show(isUpdate ? 'Programme mis à jour' : 'Programme créé', 'success');
  };

  const onRemove = (id: string) => {
    void remove(id);
    show('Programme supprimé', 'info');
  };

  const setLive = (id: string) => {
    // Only the toggled item changes; others keep their state. Simpler than the
    // old "exclusive live" rule but matches the actual product (multi-stream).
    const target = items.find((p) => p.id === id);
    if (target) void update(id, { live: !target.live } as Partial<Program>);
  };

  return (
    <>
      <PageHeader title="Grille radio" subtitle={`${items.length} créneaux programmés`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('grille-radio', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'time', label: 'Début' },
            { key: 'end', label: 'Fin' },
            { key: 'title', label: 'Émission' },
            { key: 'host', label: 'Animateur' },
            { key: 'category', label: 'Catégorie' },
            { key: 'live', label: 'En direct' },
          ])}
          createLabel="Nouveau créneau"
        />
        <Table<Program>
          rows={filtered}
          columns={[
            {
              key: 'time', label: 'Horaire',
              render: (p) => <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>{p.time} – {p.end}</span>,
              width: '120px',
            },
            {
              key: 'title', label: 'Émission',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={p.cover} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{p.host}</div>
                  </div>
                </div>
              ),
            },
            { key: 'category', label: 'Catégorie', render: (p) => p.category, width: '120px' },
            {
              key: 'live', label: 'Direct',
              render: (p) => (
                <button onClick={() => setLive(p.id)} className="px-2 py-0.5" style={{
                  background: p.live ? '#FFE5E5' : '#F2F2F5',
                  color: p.live ? '#D32F2F' : '#717182',
                  borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {p.live ? '● LIVE' : 'Programmé'}
                </button>
              ),
              width: '110px',
            },
          ]}
          onEdit={(p) => { setEditing(p); setErrors({}); }}
          onDelete={(p) => onRemove(p.id)}
          deleteLabel={(p) => `« ${p.title} » (${p.time}–${p.end})`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((p) => p.id === editing.id) ? 'Modifier le créneau' : 'Nouveau créneau'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Début (HH:MM) *" hint={errors.time}><Input value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} style={{ borderColor: errors.time ? '#D32F2F' : undefined }}/></Field>
            <Field label="Fin (HH:MM) *" hint={errors.end}><Input value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} style={{ borderColor: errors.end ? '#D32F2F' : undefined }}/></Field>
            <div className="col-span-2"><Field label="Titre de l'émission *" hint={errors.title}><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Animateur·rice *" hint={errors.host}><Input value={editing.host} onChange={(e) => setEditing({ ...editing, host: e.target.value })} style={{ borderColor: errors.host ? '#D32F2F' : undefined }}/></Field>
            <Field label="Initiales" hint="Auto si vide"><Input value={editing.hostInitials} onChange={(e) => setEditing({ ...editing, hostInitials: e.target.value.toUpperCase() })} /></Field>
            <Field label="Catégorie"><Select value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
            <Field label="En direct">
              <button type="button" onClick={() => setEditing({ ...editing, live: !editing.live })} className="px-3 py-2 w-full" style={{
                background: editing.live ? '#FFE5E5' : '#F2F2F5',
                color: editing.live ? '#D32F2F' : '#717182',
                borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
              }}>
                {editing.live ? '● Diffusé en direct' : 'Programmé (pas en direct)'}
              </button>
            </Field>
            <div className="col-span-2"><Field label="Visuel"><ImageUpload value={editing.cover} onChange={(url) => setEditing({ ...editing, cover: url })} aspect="16/9" /></Field></div>
            <div className="col-span-2">
              <Field label="Flux ou fichier audio" hint="Importez un MP3 ou collez l'URL d'un flux (MP3, AAC, ou HLS .m3u8). Utilisé pour le bouton « Lecture » de la radio quand ce créneau est en direct.">
                <MediaUpload kind="audio" value={editing.audio ?? ''} onChange={(url) => setEditing({ ...editing, audio: url })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer la grille initiale ?"
        message="Vos modifications locales seront remplacées par la grille d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { void reset(); setResetOpen(false); show('Grille réinitialisée', 'info'); }}
      />
    </>
  );
}

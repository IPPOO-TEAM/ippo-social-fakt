import { useState, useMemo } from 'react';
import { useResource, type Video } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { sections } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const SECTION_OPTIONS = sections.map((s) => ({ value: s.key, label: s.label }));
const TYPES = ['Capsule', 'Reportage', 'Portrait', 'Mini-doc', 'Tribune', 'Live', 'Tutoriel', 'Expert'];

const empty = (): Video => ({
  id: `v${Date.now()}`,
  title: '',
  type: 'Capsule',
  duration: '2:00',
  image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80',
  section: 'videos',
});

export function AdminVideos() {
  const { items, create, update, remove, reset } = useResource<Video>('videos');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Video | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Video, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((v) => (v.title + v.type).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof Video, string>> = {};
    if (!editing.title.trim()) er.title = 'Le titre est requis.';
    if (!/^\d+:\d{2}$/.test(editing.duration.trim())) er.duration = 'Format mm:ss attendu.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const isUpdate = items.some((a) => a.id === editing.id);
    if (isUpdate) update(editing.id, editing);
    else create(editing);
    setEditing(null);
    setErrors({});
    show(isUpdate ? 'Vidéo mise à jour' : 'Vidéo créée', 'success');
  };

  return (
    <>
      <PageHeader title="Vidéos" subtitle={`${items.length} vidéos`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('videos', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'type', label: 'Type' },
            { key: 'duration', label: 'Durée' },
            { key: 'section', label: 'Section' },
            { key: 'video', label: 'Vidéo', get: (v) => v.video?.startsWith('data:') ? '[fichier local]' : (v.video ?? '') },
          ])}
          createLabel="Nouvelle vidéo"
        />
        <Table<Video>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (v) => (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={v.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="line-clamp-1" style={{ fontWeight: 600 }}>{v.title}</div>
                </div>
              ),
            },
            { key: 'type', label: 'Type', render: (v) => v.type, width: '120px' },
            { key: 'duration', label: 'Durée', render: (v) => v.duration, width: '90px' },
            { key: 'section', label: 'Section', render: (v) => v.section, width: '120px' },
          ]}
          onEdit={(v) => { setEditing(v); setErrors({}); }}
          onDelete={(v) => { remove(v.id); show('Vidéo supprimée', 'info'); }}
          deleteLabel={(v) => `« ${v.title} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={160} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Type"><Select value={editing.type} onChange={(v) => setEditing({ ...editing, type: v })} options={TYPES.map((t) => ({ value: t, label: t }))} /></Field>
            <Field label="Durée *" hint={errors.duration ?? 'mm:ss'}><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} style={{ borderColor: errors.duration ? '#D32F2F' : undefined }}/></Field>
            <Field label="Section"><Select value={editing.section} onChange={(v) => setEditing({ ...editing, section: v as Video['section'] })} options={SECTION_OPTIONS} /></Field>
            <div className="col-span-2">
              <Field label="Miniature"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/9" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier vidéo" hint="Importez n'importe quel MP4 / WebM, ou collez un lien direct.">
                <MediaUpload kind="video" value={editing.video ?? ''} onChange={(url) => setEditing({ ...editing, video: url })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les données initiales ?"
        message="Vos modifications locales seront remplacées par le jeu de vidéos d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Vidéos réinitialisées', 'info'); }}
      />
    </>
  );
}

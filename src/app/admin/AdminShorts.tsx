import { useState, useMemo } from 'react';
import { useResource, type Short } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { sections } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const SECTION_OPTIONS = sections.map((s) => ({ value: s.key, label: s.label }));

const empty = (): Short => ({
  id: `s${Date.now()}`,
  title: '',
  author: '@ippoo',
  views: '0',
  duration: '0:30',
  image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80',
  section: 'videos',
});

export function AdminShorts() {
  const { items, create, update, remove, reset } = useResource<Short>('shorts');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Short | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Short, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((s) => (s.title + s.author).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof Short, string>> = {};
    if (!editing.title.trim()) er.title = 'Titre requis.';
    if (!editing.author.trim()) er.author = 'Auteur requis.';
    if (!/^\d+:\d{2}$/.test(editing.duration.trim())) er.duration = 'Format mm:ss attendu.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const isUpdate = items.some((a) => a.id === editing.id);
    if (isUpdate) update(editing.id, editing);
    else create(editing);
    setEditing(null);
    setErrors({});
    show(isUpdate ? 'Short mis à jour' : 'Short créé', 'success');
  };

  return (
    <>
      <PageHeader title="Shorts" subtitle={`${items.length} vidéos verticales`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('shorts', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'author', label: 'Auteur' },
            { key: 'views', label: 'Vues' },
            { key: 'duration', label: 'Durée' },
            { key: 'section', label: 'Section' },
            { key: 'video', label: 'Vidéo', get: (s) => s.video?.startsWith('data:') ? '[fichier local]' : (s.video ?? '') },
          ])}
          createLabel="Nouveau short"
        />
        <Table<Short>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Short',
              render: (s) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={s.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }} className="line-clamp-1">{s.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{s.author}</div>
                  </div>
                </div>
              ),
            },
            { key: 'views', label: 'Vues', render: (s) => s.views, width: '90px' },
            { key: 'duration', label: 'Durée', render: (s) => s.duration, width: '90px' },
            { key: 'section', label: 'Section', render: (s) => s.section, width: '120px' },
          ]}
          onEdit={(s) => { setEditing(s); setErrors({}); }}
          onDelete={(s) => { remove(s.id); show('Short supprimé', 'info'); }}
          deleteLabel={(s) => `« ${s.title} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier le short' : 'Nouveau short'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={120} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Auteur *" hint={errors.author}><Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} style={{ borderColor: errors.author ? '#D32F2F' : undefined }}/></Field>
            <Field label="Vues"><Input value={editing.views} onChange={(e) => setEditing({ ...editing, views: e.target.value })} /></Field>
            <Field label="Durée *" hint={errors.duration ?? 'mm:ss'}><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} style={{ borderColor: errors.duration ? '#D32F2F' : undefined }}/></Field>
            <Field label="Section"><Select value={editing.section} onChange={(v) => setEditing({ ...editing, section: v as Short['section'] })} options={SECTION_OPTIONS} /></Field>
            <div className="col-span-2">
              <Field label="Miniature (poster vertical 9:16)"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="9/16" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier vidéo vertical" hint="Importez un MP4 / WebM vertical (9:16) ou collez un lien direct. Sans fichier, un échantillon de démo est utilisé.">
                <MediaUpload kind="video" value={editing.video ?? ''} onChange={(url) => setEditing({ ...editing, video: url })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les shorts initiaux ?"
        message="Vos modifications locales seront remplacées par le jeu de shorts d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Shorts réinitialisés', 'info'); }}
      />
    </>
  );
}

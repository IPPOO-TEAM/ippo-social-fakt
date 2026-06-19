import { useState, useMemo } from 'react';
import { useResource, type Episode } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { sections } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const SECTION_OPTIONS = sections.map((s) => ({ value: s.key, label: s.label }));
const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2'];

const empty = (): Episode => ({
  id: `p${Date.now()}`,
  title: '',
  show: '',
  duration: '20 min',
  plays: '0',
  image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80',
  color: '#0066FF',
  section: 'podcast',
});

export function AdminEpisodes() {
  const { items, create, update, remove, reset } = useResource<Episode>('episodes');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Episode | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Episode, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((p) => (p.title + p.show).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof Episode, string>> = {};
    if (!editing.title.trim()) er.title = 'Le titre est requis.';
    if (!editing.show.trim()) er.show = "L'émission est requise.";
    if (!/^\d+\s?(min|h)/.test(editing.duration.trim())) er.duration = 'Format ex. « 22 min ».';
    if (!/^\d+([.,]\d+)?\s?(k|M)?$/i.test(editing.plays.trim())) er.plays = 'Nombre attendu (ex. 1240, 12k).';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const isUpdate = items.some((a) => a.id === editing.id);
    if (isUpdate) update(editing.id, editing);
    else create(editing);
    setEditing(null);
    setErrors({});
    show(isUpdate ? 'Épisode mis à jour' : 'Épisode créé', 'success');
  };

  return (
    <>
      <PageHeader title="Podcasts" subtitle={`${items.length} épisodes`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('podcasts', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'show', label: 'Émission' },
            { key: 'duration', label: 'Durée' },
            { key: 'plays', label: 'Écoutes' },
            { key: 'section', label: 'Section' },
            { key: 'audio', label: 'Audio', get: (p) => p.audio?.startsWith('data:') ? '[fichier local]' : (p.audio ?? '') },
          ])}
          createLabel="Nouvel épisode"
        />
        <Table<Episode>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="line-clamp-1" style={{ fontWeight: 600 }}>{p.title}</div>
                </div>
              ),
            },
            { key: 'show', label: 'Émission', render: (p) => <span style={{ color: p.color, fontWeight: 600, fontSize: '0.78rem' }}>{p.show}</span>, width: '170px' },
            { key: 'duration', label: 'Durée', render: (p) => p.duration, width: '90px' },
            { key: 'plays', label: 'Écoutes', render: (p) => p.plays, width: '90px' },
            { key: 'section', label: 'Section', render: (p) => p.section, width: '120px' },
          ]}
          onEdit={(p) => { setEditing(p); setErrors({}); }}
          onDelete={(p) => { remove(p.id); show('Épisode supprimé', 'info'); }}
          deleteLabel={(p) => `« ${p.title} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier l\'épisode' : 'Nouvel épisode'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={160} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Émission *" hint={errors.show}><Input value={editing.show} onChange={(e) => setEditing({ ...editing, show: e.target.value })} style={{ borderColor: errors.show ? '#D32F2F' : undefined }}/></Field>
            <Field label="Durée *" hint={errors.duration ?? 'ex. « 22 min »'}><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} style={{ borderColor: errors.duration ? '#D32F2F' : undefined }}/></Field>
            <Field label="Écoutes" hint={errors.plays ?? 'ex. 1240 ou 12k'}><Input value={editing.plays} onChange={(e) => setEditing({ ...editing, plays: e.target.value })} style={{ borderColor: errors.plays ? '#D32F2F' : undefined }}/></Field>
            <Field label="Section"><Select value={editing.section} onChange={(v) => setEditing({ ...editing, section: v as Episode['section'] })} options={SECTION_OPTIONS} /></Field>
            <Field label="Couleur">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className="w-8 h-8" style={{ background: c, borderRadius: 8, border: editing.color === c ? '2px solid #1a1a1a' : '2px solid transparent' }} />
                ))}
              </div>
            </Field>
            <div className="col-span-2">
              <Field label="Pochette"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="1/1" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier audio" hint="Importez un MP3 ou collez l'URL d'un flux audio.">
                <MediaUpload kind="audio" value={editing.audio ?? ''} onChange={(url) => setEditing({ ...editing, audio: url })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les données initiales ?"
        message="Vos modifications locales seront remplacées par le jeu d'épisodes d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Épisodes réinitialisés', 'info'); }}
      />
    </>
  );
}

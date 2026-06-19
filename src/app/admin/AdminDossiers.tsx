import { useState, useMemo } from 'react';
import { useResource, type Dossier } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Modal, Btn, ImageUpload, exportCsv } from './ui';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2'];

const empty = (): Dossier => ({
  id: `d${Date.now()}`,
  title: '',
  subtitle: '',
  image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1200&q=80',
  color: '#0066FF',
});

export function AdminDossiers() {
  const { items, create, update, remove, reset } = useResource<Dossier>('dossiers');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Dossier | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Dossier, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((d) => (d.title + d.subtitle).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof Dossier, string>> = {};
    if (!editing.title.trim()) er.title = 'Le titre est requis.';
    if (!editing.subtitle.trim()) er.subtitle = 'Le sous-titre est requis.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const isUpdate = items.some((a) => a.id === editing.id);
    if (isUpdate) update(editing.id, editing); else create(editing);
    setEditing(null); setErrors({});
    show(isUpdate ? 'Dossier mis à jour' : 'Dossier créé', 'success');
  };

  return (
    <>
      <PageHeader title="Dossiers" subtitle={`${items.length} dossiers thématiques`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('dossiers', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'subtitle', label: 'Sous-titre' },
            { key: 'color', label: 'Accent' },
          ])}
          createLabel="Nouveau dossier"
        />
        <Table<Dossier>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Dossier',
              render: (d) => (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={d.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1" style={{ fontWeight: 600 }}>{d.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{d.subtitle}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'color', label: 'Accent',
              render: (d) => <div className="w-6 h-6" style={{ background: d.color, borderRadius: 4 }} />,
              width: '90px',
            },
          ]}
          onEdit={(d) => { setEditing(d); setErrors({}); }}
          onDelete={(d) => { remove(d.id); show('Dossier supprimé', 'info'); }}
          deleteLabel={(d) => `« ${d.title} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier le dossier' : 'Nouveau dossier'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={160} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <div className="col-span-2"><Field label="Sous-titre *" hint={errors.subtitle}><Input value={editing.subtitle} maxLength={200} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} style={{ borderColor: errors.subtitle ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Couleur d'accent">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className="w-8 h-8" style={{ background: c, borderRadius: 8, border: editing.color === c ? '2px solid #1a1a1a' : '2px solid transparent' }} />
                ))}
              </div>
            </Field>
            <div />
            <div className="col-span-2">
              <Field label="Image"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/8" /></Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les données initiales ?"
        message="Vos modifications locales seront remplacées par le jeu de dossiers d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Dossiers réinitialisés', 'info'); }}
      />
    </>
  );
}

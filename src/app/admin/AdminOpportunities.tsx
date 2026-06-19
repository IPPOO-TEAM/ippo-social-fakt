import { useState, useMemo } from 'react';
import { useResource, type Opportunity } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, exportCsv } from './ui';
import { sections } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const SECTION_OPTIONS = sections.map((s) => ({ value: s.key, label: s.label }));
const TAGS = ['Bourse', 'Concours', 'Formation', 'Financement', 'Mentorat', 'Incubation', 'Microcrédit', 'Subvention', 'Diaspora'];
const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2'];

const empty = (): Opportunity => ({
  id: `o${Date.now()}`,
  title: '',
  deadline: '',
  tag: 'Bourse',
  color: '#0066FF',
  image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80',
  section: 'opportunities',
});

export function AdminOpportunities() {
  const { items, create, update, remove, reset } = useResource<Opportunity>('opportunities');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Opportunity, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((o) => (o.title + o.tag).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof Opportunity, string>> = {};
    if (!editing.title.trim()) er.title = 'Le titre est requis.';
    if (!editing.deadline.trim()) er.deadline = "L'échéance est requise.";
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const isUpdate = items.some((a) => a.id === editing.id);
    if (isUpdate) update(editing.id, editing);
    else create(editing);
    setEditing(null);
    setErrors({});
    show(isUpdate ? 'Opportunité mise à jour' : 'Opportunité créée', 'success');
  };

  return (
    <>
      <PageHeader title="Opportunités" subtitle={`${items.length} opportunités`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('opportunites', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'tag', label: 'Catégorie' },
            { key: 'deadline', label: 'Échéance' },
            { key: 'section', label: 'Section' },
          ])}
          createLabel="Nouvelle opportunité"
        />
        <Table<Opportunity>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (o) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={o.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="line-clamp-1" style={{ fontWeight: 600 }}>{o.title}</div>
                </div>
              ),
            },
            {
              key: 'tag', label: 'Catégorie',
              render: (o) => <span className="px-2 py-0.5 text-white" style={{ background: o.color, fontSize: '0.7rem', fontWeight: 600, borderRadius: 4 }}>{o.tag}</span>,
              width: '140px',
            },
            { key: 'deadline', label: 'Échéance', render: (o) => o.deadline, width: '110px' },
            { key: 'section', label: 'Section', render: (o) => o.section, width: '120px' },
          ]}
          onEdit={(o) => { setEditing(o); setErrors({}); }}
          onDelete={(o) => { remove(o.id); show('Opportunité supprimée', 'info'); }}
          deleteLabel={(o) => `« ${o.title} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={160} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Catégorie"><Select value={editing.tag} onChange={(v) => setEditing({ ...editing, tag: v })} options={TAGS.map((t) => ({ value: t, label: t }))} /></Field>
            <Field label="Échéance *" hint={errors.deadline ?? 'ex. 30 juin 2026'}><Input value={editing.deadline} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} style={{ borderColor: errors.deadline ? '#D32F2F' : undefined }}/></Field>
            <Field label="Section"><Select value={editing.section} onChange={(v) => setEditing({ ...editing, section: v as Opportunity['section'] })} options={SECTION_OPTIONS} /></Field>
            <Field label="Couleur">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className="w-8 h-8" style={{ background: c, borderRadius: 8, border: editing.color === c ? '2px solid #1a1a1a' : '2px solid transparent' }} />
                ))}
              </div>
            </Field>
            <div className="col-span-2">
              <Field label="Image"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/9" /></Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les données initiales ?"
        message="Vos modifications locales seront remplacées par le jeu d'opportunités d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Opportunités réinitialisées', 'info'); }}
      />
    </>
  );
}

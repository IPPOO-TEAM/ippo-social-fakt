import { useState, useMemo } from 'react';
import { useResource, type Article } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Textarea, Select, Modal, Btn, ImageUpload, exportCsv } from './ui';
import { sections } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const SECTION_OPTIONS = sections.map((s) => ({ value: s.key, label: s.label }));
const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2', '#1a1a1a'];

const empty = (): Article => ({
  id: `a${Date.now()}`,
  title: '',
  category: '',
  location: '',
  image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  date: "À l'instant",
  readTime: '3 min',
  color: '#0066FF',
  excerpt: '',
  section: 'actu',
});

export function AdminArticles() {
  const { items, create, update, remove, reset } = useResource<Article>('articles');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Article | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Article, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q)
    );
  }, [items, search]);

  const validate = (a: Article) => {
    const er: Partial<Record<keyof Article, string>> = {};
    if (!a.title.trim()) er.title = 'Le titre est requis.';
    else if (a.title.length > 160) er.title = 'Maximum 160 caractères.';
    if (!a.excerpt.trim()) er.excerpt = "L'extrait est requis.";
    else if (a.excerpt.length > 400) er.excerpt = 'Maximum 400 caractères.';
    if (!a.category.trim()) er.category = 'La rubrique est requise.';
    if (!a.section) er.section = 'La section est requise.';
    return er;
  };

  const onSave = () => {
    if (!editing) return;
    const er = validate(editing);
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Veuillez corriger les champs en rouge.', 'error'); return; }
    const isUpdate = items.some((a) => a.id === editing.id);
    if (isUpdate) update(editing.id, editing);
    else create(editing);
    setEditing(null);
    setErrors({});
    show(isUpdate ? 'Article mis à jour' : 'Article créé', 'success');
  };

  return (
    <>
      <PageHeader
        title="Articles"
        subtitle={`${items.length} articles publiés`}
      />

      <div className="p-8">
        <Toolbar
          search={search}
          onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('articles', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'excerpt', label: 'Extrait' },
            { key: 'category', label: 'Rubrique' },
            { key: 'location', label: 'Lieu' },
            { key: 'section', label: 'Section' },
            { key: 'date', label: 'Date' },
            { key: 'readTime', label: 'Lecture' },
          ])}
          createLabel="Nouvel article"
        />

        <Table<Article>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (a) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    <img src={a.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1" style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{a.excerpt.slice(0, 70)}{a.excerpt.length > 70 ? '…' : ''}</div>
                  </div>
                </div>
              ),
            },
            { key: 'category', label: 'Rubrique', render: (a) => <span style={{ color: a.color, fontWeight: 600, fontSize: '0.78rem' }}>{a.category}</span>, width: '160px' },
            { key: 'location', label: 'Lieu', render: (a) => a.location, width: '120px' },
            { key: 'section', label: 'Section', render: (a) => a.section, width: '120px' },
            { key: 'date', label: 'Date', render: (a) => <span style={{ color: '#717182' }}>{a.date}</span>, width: '110px' },
          ]}
          onEdit={(a) => { setEditing(a); setErrors({}); }}
          onDelete={(a) => { remove(a.id); show('Article supprimé', 'info'); }}
          deleteLabel={(a) => `« ${a.title} »`}
        />
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier l\'article' : 'Nouvel article'}
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={onSave}>Enregistrer</Btn>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Titre *" hint={errors.title}>
                <Input value={editing.title} maxLength={160} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Extrait *" hint={errors.excerpt ?? `${editing.excerpt.length}/400`}>
                <Textarea value={editing.excerpt} maxLength={400} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} style={{ borderColor: errors.excerpt ? '#D32F2F' : undefined }}/>
              </Field>
            </div>
            <Field label="Rubrique *" hint={errors.category}>
              <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={{ borderColor: errors.category ? '#D32F2F' : undefined }}/>
            </Field>
            <Field label="Lieu">
              <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
            </Field>
            <Field label="Date affichée">
              <Input value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </Field>
            <Field label="Temps de lecture">
              <Input value={editing.readTime} onChange={(e) => setEditing({ ...editing, readTime: e.target.value })} />
            </Field>
            <Field label="Section">
              <Select value={editing.section} onChange={(v) => setEditing({ ...editing, section: v as Article['section'] })} options={SECTION_OPTIONS} />
            </Field>
            <Field label="Couleur de rubrique">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: c })}
                    className="w-8 h-8 transition-transform hover:scale-110"
                    style={{ background: c, borderRadius: 8, border: editing.color === c ? '2px solid #1a1a1a' : '2px solid transparent' }}
                  />
                ))}
              </div>
            </Field>
            <div className="col-span-2">
              <Field label="Image" hint="Importez depuis votre appareil ou collez une URL.">
                <ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/8" />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les données initiales ?"
        message="Vos modifications locales seront remplacées par le jeu d'articles d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Articles réinitialisés', 'info'); }}
      />
    </>
  );
}

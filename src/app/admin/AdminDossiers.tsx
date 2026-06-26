import { useState, useMemo } from 'react';
import { Eye, EyeOff, Plus, Send } from 'lucide-react';
import { useResource, type Dossier } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, exportCsv } from './ui';
import { useAllSections, useTaxonomy, rubricsFor, addRubric } from '../lib/taxonomy';
import { useAdminToast, ConfirmDialog } from './AdminToast';

interface DossierEdit extends Dossier { section?: string; }

const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2'];

const empty = (): DossierEdit => ({
  id: `d${Date.now()}`,
  title: '',
  subtitle: '',
  image: '',
  color: '#0066FF',
  section: 'actu',
  category: '',
  published: false,
});

export function AdminDossiers() {
  const { items, create, update, remove } = useResource<DossierEdit>('dossiers');
  const { show } = useAdminToast();
  const allSections = useAllSections();
  const SECTION_OPTIONS = useMemo(() => allSections.map((s) => ({ value: s.key, label: s.label })), [allSections]);
  const { state: taxonomy, commit: commitTaxonomy } = useTaxonomy();

  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<DossierEdit | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof DossierEdit, string>>>({});
  const [newRubric, setNewRubric] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((d) => {
      if (filterPublished === 'published' && !d.published) return false;
      if (filterPublished === 'draft' && d.published) return false;
      if (!q) return true;
      return (d.title + d.subtitle).toLowerCase().includes(q);
    });
  }, [items, search, filterPublished]);

  const onSave = (publish?: boolean) => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setErrors({ title: 'Le titre est requis.' });
      show('Le titre est requis.', 'error');
      return;
    }
    const filled: DossierEdit = {
      ...editing,
      published: typeof publish === 'boolean' ? publish : (editing.published ?? false),
    };
    const isUpdate = items.some((a) => a.id === filled.id);
    if (isUpdate) update(filled.id, filled); else create(filled);
    setEditing(null); setErrors({});
    show(
      isUpdate
        ? (filled.published ? 'Dossier mis à jour et publié' : 'Brouillon mis à jour')
        : (filled.published ? 'Dossier publié' : 'Brouillon enregistré'),
      'success',
    );
  };

  const sectionKey = editing ? String(editing.section ?? 'actu') : 'actu';
  const sectionRubrics = editing ? rubricsFor(taxonomy, sectionKey) : [];

  const addNewRubric = () => {
    if (!editing || !newRubric.trim()) return;
    commitTaxonomy(addRubric(taxonomy, sectionKey, newRubric));
    setEditing({ ...editing, category: newRubric.trim() });
    setNewRubric('');
  };

  return (
    <>
      <PageHeader
        title="Dossiers"
        subtitle={`${items.length} dossier${items.length > 1 ? 's' : ''} · ${items.filter((a) => a.published).length} publié${items.filter((a) => a.published).length > 1 ? 's' : ''}`}
      />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); setNewRubric(''); }}
          onExport={() => exportCsv('dossiers', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'subtitle', label: 'Sous-titre' },
            { key: 'category', label: 'Rubrique' },
            { key: 'color', label: 'Accent' },
            { key: 'published', label: 'Publié' },
          ])}
          createLabel="Nouveau dossier"
        />

        <div className="flex items-center gap-2 mb-4">
          {(['all', 'published', 'draft'] as const).map((k) => {
            const active = filterPublished === k;
            return (
              <button
                key={k}
                onClick={() => setFilterPublished(k)}
                className="px-3 py-1.5"
                style={{
                  background: active ? '#1a1a1a' : '#F4F4F6',
                  color: active ? 'white' : '#717182',
                  fontSize: '0.78rem', fontWeight: 600, borderRadius: 999,
                }}
              >
                {k === 'all' ? `Tous (${items.length})` : k === 'published' ? `Publiés (${items.filter((a) => a.published).length})` : `Brouillons (${items.filter((a) => !a.published).length})`}
              </button>
            );
          })}
        </div>

        <Table<DossierEdit>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Dossier',
              render: (d) => (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    {d.image ? <img src={d.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {d.title || <span className="text-[#717182] italic">(sans titre)</span>}
                      {d.published ? null : <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#FF8A00]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>BROUILLON</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{d.subtitle}</div>
                  </div>
                </div>
              ),
            },
            { key: 'category', label: 'Rubrique', render: (d) => <span style={{ color: d.color, fontWeight: 600, fontSize: '0.78rem' }}>{d.category || '—'}</span>, width: '160px' },
            {
              key: 'color', label: 'Accent',
              render: (d) => <div className="w-6 h-6" style={{ background: d.color, borderRadius: 4 }} />,
              width: '90px',
            },
          ]}
          onEdit={(d) => { setEditing(d); setErrors({}); setNewRubric(''); }}
          onDelete={(d) => { remove(d.id); show('Dossier supprimé', 'info'); }}
          deleteLabel={(d) => `« ${d.title || 'sans titre'} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier le dossier' : 'Nouveau dossier'}
        footer={
          <>
            <Btn onClick={() => setEditing(null)}>Annuler</Btn>
            <Btn onClick={() => onSave(false)}>Enregistrer en brouillon</Btn>
            <Btn variant="primary" onClick={() => onSave(true)}><Send size={13}/> {editing?.published ? 'Mettre à jour' : 'Publier maintenant'}</Btn>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>

            <div className="col-span-2 -mb-2">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[#FAFAFA]" style={{ borderRadius: 10 }}>
                {editing.published ? <Eye size={14} className="text-[#00A03B]"/> : <EyeOff size={14} className="text-[#FF8A00]"/>}
                <div className="flex-1" style={{ fontSize: '0.82rem', color: '#1a1a1a', fontWeight: 600 }}>
                  {editing.published ? 'Publié — visible par tous les utilisateurs' : 'Brouillon — invisible côté public'}
                </div>
                <button
                  onClick={() => setEditing({ ...editing, published: !editing.published })}
                  className="px-3 py-1.5"
                  style={{ background: editing.published ? '#FFF3E0' : '#E4F7E9', color: editing.published ? '#FF8A00' : '#00A03B', fontSize: '0.74rem', fontWeight: 700, borderRadius: 999 }}
                >
                  {editing.published ? 'Repasser en brouillon' : 'Marquer prêt à publier'}
                </button>
              </div>
            </div>

            <div className="col-span-2"><Field label="Sous-titre"><Input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}/></Field></div>

            <Field label="Section">
              <Select value={sectionKey} onChange={(v) => setEditing({ ...editing, section: v, category: '' })} options={SECTION_OPTIONS} />
            </Field>

            <div>
              <Field label="Rubrique" hint={`${sectionRubrics.length} rubrique${sectionRubrics.length > 1 ? 's' : ''} disponible${sectionRubrics.length > 1 ? 's' : ''}`}>
                <Select
                  value={editing.category ?? ''}
                  onChange={(v) => setEditing({ ...editing, category: v })}
                  options={[{ value: '', label: '— Choisir —' }, ...sectionRubrics.map((r) => ({ value: r, label: r }))]}
                />
              </Field>
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={newRubric}
                  onChange={(e) => setNewRubric(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewRubric(); } }}
                  placeholder="…ou créer une nouvelle rubrique"
                  className="flex-1 px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
                  style={{ borderRadius: 8, fontSize: '0.78rem' }}
                />
                <Btn onClick={addNewRubric}><Plus size={12}/> Créer</Btn>
              </div>
            </div>

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

            <div className="col-span-2">
              <div className="text-[#717182] mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>APERÇU</div>
              <div className="bg-white border border-[#EAEAEE] overflow-hidden" style={{ borderRadius: 12 }}>
                <div className="aspect-[16/8] bg-[#F0F0F4]">
                  {editing.image ? <img src={editing.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#9A9AA8]" style={{ fontSize: '0.82rem' }}>Aucune image</div>}
                </div>
                <div className="p-4">
                  <div className="inline-block px-2 py-0.5 mb-2" style={{ background: editing.color, color: 'white', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', borderRadius: 4 }}>
                    {(editing.category || 'RUBRIQUE').toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                    {editing.title || <span className="text-[#9A9AA8]">Titre du dossier</span>}
                  </div>
                  {editing.subtitle && <div className="mt-1.5 text-[#717182]" style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{editing.subtitle}</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

void ConfirmDialog;

import { useState, useMemo } from 'react';
import { Eye, EyeOff, Plus, Send } from 'lucide-react';
import { useResource, type Short } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { useAllSections, useTaxonomy, rubricsFor, addRubric } from '../lib/taxonomy';
import { useAdminToast, ConfirmDialog } from './AdminToast';

interface ShortEdit extends Short { type?: string; }

const empty = (): ShortEdit => ({
  id: `s${Date.now()}`,
  title: '',
  author: '',
  views: '',
  duration: '',
  image: '',
  section: 'videos',
  type: '',
  published: false,
});

export function AdminShorts() {
  const { items, create, update, remove } = useResource<ShortEdit>('shorts');
  const { show } = useAdminToast();
  const allSections = useAllSections();
  const SECTION_OPTIONS = useMemo(() => allSections.map((s) => ({ value: s.key, label: s.label })), [allSections]);
  const { state: taxonomy, commit: commitTaxonomy } = useTaxonomy();

  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<ShortEdit | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ShortEdit, string>>>({});
  const [newRubric, setNewRubric] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((s) => {
      if (filterPublished === 'published' && !s.published) return false;
      if (filterPublished === 'draft' && s.published) return false;
      if (!q) return true;
      return (s.title + s.author).toLowerCase().includes(q);
    });
  }, [items, search, filterPublished]);

  const onSave = (publish?: boolean) => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setErrors({ title: 'Le titre est requis.' });
      show('Le titre est requis.', 'error');
      return;
    }
    const filled: ShortEdit = {
      ...editing,
      published: typeof publish === 'boolean' ? publish : (editing.published ?? false),
    };
    const isUpdate = items.some((a) => a.id === filled.id);
    if (isUpdate) update(filled.id, filled);
    else create(filled);
    setEditing(null);
    setErrors({});
    show(
      isUpdate
        ? (filled.published ? 'Short mis à jour et publié' : 'Brouillon mis à jour')
        : (filled.published ? 'Short publié' : 'Brouillon enregistré'),
      'success',
    );
  };

  const sectionRubrics = editing ? rubricsFor(taxonomy, String(editing.section)) : [];

  const addNewRubric = () => {
    if (!editing || !newRubric.trim()) return;
    commitTaxonomy(addRubric(taxonomy, String(editing.section), newRubric));
    setEditing({ ...editing, type: newRubric.trim() });
    setNewRubric('');
  };

  return (
    <>
      <PageHeader
        title="Shorts"
        subtitle={`${items.length} short${items.length > 1 ? 's' : ''} · ${items.filter((a) => a.published).length} publié${items.filter((a) => a.published).length > 1 ? 's' : ''}`}
      />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); setNewRubric(''); }}
          onExport={() => exportCsv('shorts', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'author', label: 'Auteur' },
            { key: 'views', label: 'Vues' },
            { key: 'duration', label: 'Durée' },
            { key: 'section', label: 'Section' },
            { key: 'type', label: 'Rubrique' },
            { key: 'published', label: 'Publié' },
            { key: 'video', label: 'Vidéo', get: (s) => s.video?.startsWith('data:') ? '[fichier local]' : (s.video ?? '') },
          ])}
          createLabel="Nouveau short"
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

        <Table<ShortEdit>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Short',
              render: (s) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    {s.image ? <img src={s.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <span className="line-clamp-1">{s.title || <span className="text-[#717182] italic">(sans titre)</span>}</span>
                      {s.published ? null : <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#FF8A00]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>BROUILLON</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{s.author || '—'}</div>
                  </div>
                </div>
              ),
            },
            { key: 'views', label: 'Vues', render: (s) => s.views || '—', width: '90px' },
            { key: 'duration', label: 'Durée', render: (s) => s.duration || '—', width: '90px' },
            { key: 'section', label: 'Section', render: (s) => String(s.section), width: '120px' },
          ]}
          onEdit={(s) => { setEditing(s); setErrors({}); setNewRubric(''); }}
          onDelete={(s) => { remove(s.id); show('Short supprimé', 'info'); }}
          deleteLabel={(s) => `« ${s.title || 'sans titre'} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier le short' : 'Nouveau short'}
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

            <Field label="Auteur"><Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })}/></Field>
            <Field label="Vues"><Input value={editing.views} onChange={(e) => setEditing({ ...editing, views: e.target.value })} /></Field>
            <Field label="Durée" hint="mm:ss"><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })}/></Field>

            <Field label="Section">
              <Select value={String(editing.section)} onChange={(v) => setEditing({ ...editing, section: v, type: '' })} options={SECTION_OPTIONS} />
            </Field>

            <div className="col-span-2">
              <Field label="Rubrique" hint={`${sectionRubrics.length} rubrique${sectionRubrics.length > 1 ? 's' : ''} disponible${sectionRubrics.length > 1 ? 's' : ''}`}>
                <Select
                  value={editing.type ?? ''}
                  onChange={(v) => setEditing({ ...editing, type: v })}
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

            <div className="col-span-2">
              <Field label="Miniature (poster vertical 9:16)"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="9/16" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier vidéo vertical" hint="Importez un MP4 / WebM vertical (9:16) ou collez un lien direct.">
                <MediaUpload kind="video" value={editing.video ?? ''} onChange={(url) => setEditing({ ...editing, video: url })} />
              </Field>
            </div>

            <div className="col-span-2">
              <div className="text-[#717182] mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>APERÇU</div>
              <div className="bg-white border border-[#EAEAEE] overflow-hidden flex" style={{ borderRadius: 12 }}>
                <div className="bg-[#F0F0F4]" style={{ width: 120, aspectRatio: '9/16' }}>
                  {editing.image ? <img src={editing.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#9A9AA8]" style={{ fontSize: '0.72rem' }}>Aucune image</div>}
                </div>
                <div className="p-4 flex-1">
                  <div className="inline-block px-2 py-0.5 mb-2" style={{ background: '#FF3FA4', color: 'white', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', borderRadius: 4 }}>
                    {(editing.type || 'RUBRIQUE').toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                    {editing.title || <span className="text-[#9A9AA8]">Titre du short</span>}
                  </div>
                  <div className="mt-2 text-[#717182]" style={{ fontSize: '0.72rem' }}>
                    {editing.author && <span>{editing.author}</span>}
                    {editing.author && editing.duration && <span> · </span>}
                    {editing.duration && <span>{editing.duration}</span>}
                  </div>
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

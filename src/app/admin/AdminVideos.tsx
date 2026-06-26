import { useState, useMemo } from 'react';
import { Eye, EyeOff, Plus, Send } from 'lucide-react';
import { useResource, type Video } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Textarea, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { useAllSections, useTaxonomy, rubricsFor, addRubric } from '../lib/taxonomy';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const empty = (): Video => ({
  id: `v${Date.now()}`,
  title: '',
  type: '',
  duration: '',
  image: '',
  section: 'videos',
  body: '',
  published: false,
});

export function AdminVideos() {
  const { items, create, update, remove } = useResource<Video>('videos');
  const { show } = useAdminToast();
  const allSections = useAllSections();
  const SECTION_OPTIONS = useMemo(() => allSections.map((s) => ({ value: s.key, label: s.label })), [allSections]);
  const { state: taxonomy, commit: commitTaxonomy } = useTaxonomy();

  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Video | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Video, string>>>({});
  const [newRubric, setNewRubric] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((v) => {
      if (filterPublished === 'published' && !v.published) return false;
      if (filterPublished === 'draft' && v.published) return false;
      if (!q) return true;
      return (v.title + v.type).toLowerCase().includes(q);
    });
  }, [items, search, filterPublished]);

  const onSave = (publish?: boolean) => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setErrors({ title: 'Le titre est requis.' });
      show('Le titre est requis.', 'error');
      return;
    }
    const filled: Video = {
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
        ? (filled.published ? 'Vidéo mise à jour et publiée' : 'Brouillon mis à jour')
        : (filled.published ? 'Vidéo publiée' : 'Brouillon enregistré'),
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
        title="Vidéos"
        subtitle={`${items.length} vidéo${items.length > 1 ? 's' : ''} · ${items.filter((a) => a.published).length} publiée${items.filter((a) => a.published).length > 1 ? 's' : ''}`}
      />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); setNewRubric(''); }}
          onExport={() => exportCsv('videos', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'type', label: 'Type' },
            { key: 'duration', label: 'Durée' },
            { key: 'section', label: 'Section' },
            { key: 'published', label: 'Publié' },
            { key: 'video', label: 'Vidéo', get: (v) => v.video?.startsWith('data:') ? '[fichier local]' : (v.video ?? '') },
          ])}
          createLabel="Nouvelle vidéo"
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

        <Table<Video>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (v) => (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    {v.image ? <img src={v.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {v.title || <span className="text-[#717182] italic">(sans titre)</span>}
                      {v.published ? null : <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#FF8A00]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>BROUILLON</span>}
                    </div>
                  </div>
                </div>
              ),
            },
            { key: 'type', label: 'Type', render: (v) => v.type || '—', width: '140px' },
            { key: 'duration', label: 'Durée', render: (v) => v.duration || '—', width: '90px' },
            { key: 'section', label: 'Section', render: (v) => String(v.section), width: '120px' },
          ]}
          onEdit={(v) => { setEditing(v); setErrors({}); setNewRubric(''); }}
          onDelete={(v) => { remove(v.id); show('Vidéo supprimée', 'info'); }}
          deleteLabel={(v) => `« ${v.title || 'sans titre'} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
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

            <Field label="Section">
              <Select value={String(editing.section)} onChange={(v) => setEditing({ ...editing, section: v, type: '' })} options={SECTION_OPTIONS} />
            </Field>

            <div>
              <Field label="Type / Rubrique" hint={`${sectionRubrics.length} rubrique${sectionRubrics.length > 1 ? 's' : ''} disponible${sectionRubrics.length > 1 ? 's' : ''}`}>
                <Select
                  value={editing.type}
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

            <Field label="Durée" hint="mm:ss"><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })}/></Field>
            <div />

            <div className="col-span-2">
              <Field label="Description" hint="Détails affichés sur la page de la vidéo">
                <Textarea
                  value={editing.body ?? ''}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder={`Description complète de la vidéo…\n\nSéparez les paragraphes par une ligne vide.`}
                  style={{ minHeight: 200, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}
                />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Miniature"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/9" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier vidéo" hint="Importez n'importe quel MP4 / WebM, ou collez un lien direct.">
                <MediaUpload kind="video" value={editing.video ?? ''} onChange={(url) => setEditing({ ...editing, video: url })} />
              </Field>
            </div>

            <div className="col-span-2">
              <div className="text-[#717182] mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>APERÇU</div>
              <div className="bg-white border border-[#EAEAEE] overflow-hidden" style={{ borderRadius: 12 }}>
                <div className="aspect-video bg-[#F0F0F4]">
                  {editing.image ? <img src={editing.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#9A9AA8]" style={{ fontSize: '0.82rem' }}>Aucune image</div>}
                </div>
                <div className="p-4">
                  <div className="inline-block px-2 py-0.5 mb-2" style={{ background: '#0066FF', color: 'white', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', borderRadius: 4 }}>
                    {(editing.type || 'TYPE').toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                    {editing.title || <span className="text-[#9A9AA8]">Titre de la vidéo</span>}
                  </div>
                  {editing.duration && <div className="mt-2 text-[#717182]" style={{ fontSize: '0.72rem' }}>{editing.duration}</div>}
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

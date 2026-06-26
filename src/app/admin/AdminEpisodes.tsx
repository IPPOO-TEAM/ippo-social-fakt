import { useState, useMemo } from 'react';
import { Eye, EyeOff, Plus, Send } from 'lucide-react';
import { useResource, type Episode } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Textarea, Select, Modal, Btn, ImageUpload, MediaUpload, exportCsv } from './ui';
import { useAllSections, useTaxonomy, rubricsFor, addRubric } from '../lib/taxonomy';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2'];

const empty = (): Episode => ({
  id: `p${Date.now()}`,
  title: '',
  show: '',
  duration: '',
  plays: '',
  image: '',
  color: '#0066FF',
  section: 'podcast',
  body: '',
  published: false,
});

export function AdminEpisodes() {
  const { items, create, update, remove } = useResource<Episode>('episodes');
  const { show } = useAdminToast();
  const allSections = useAllSections();
  const SECTION_OPTIONS = useMemo(() => allSections.map((s) => ({ value: s.key, label: s.label })), [allSections]);
  const { state: taxonomy, commit: commitTaxonomy } = useTaxonomy();

  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Episode | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Episode, string>>>({});
  const [newRubric, setNewRubric] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((p) => {
      if (filterPublished === 'published' && !p.published) return false;
      if (filterPublished === 'draft' && p.published) return false;
      if (!q) return true;
      return (p.title + p.show).toLowerCase().includes(q);
    });
  }, [items, search, filterPublished]);

  const onSave = (publish?: boolean) => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setErrors({ title: 'Le titre est requis.' });
      show('Le titre est requis.', 'error');
      return;
    }
    const filled: Episode = {
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
        ? (filled.published ? 'Épisode mis à jour et publié' : 'Brouillon mis à jour')
        : (filled.published ? 'Épisode publié' : 'Brouillon enregistré'),
      'success',
    );
  };

  const sectionRubrics = editing ? rubricsFor(taxonomy, String(editing.section)) : [];

  const addNewRubric = () => {
    if (!editing || !newRubric.trim()) return;
    commitTaxonomy(addRubric(taxonomy, String(editing.section), newRubric));
    setEditing({ ...editing, show: newRubric.trim() });
    setNewRubric('');
  };

  return (
    <>
      <PageHeader
        title="Podcasts"
        subtitle={`${items.length} épisode${items.length > 1 ? 's' : ''} · ${items.filter((a) => a.published).length} publié${items.filter((a) => a.published).length > 1 ? 's' : ''}`}
      />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); setNewRubric(''); }}
          onExport={() => exportCsv('podcasts', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'show', label: 'Émission' },
            { key: 'duration', label: 'Durée' },
            { key: 'plays', label: 'Écoutes' },
            { key: 'section', label: 'Section' },
            { key: 'published', label: 'Publié' },
            { key: 'audio', label: 'Audio', get: (p) => p.audio?.startsWith('data:') ? '[fichier local]' : (p.audio ?? '') },
          ])}
          createLabel="Nouvel épisode"
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

        <Table<Episode>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {p.title || <span className="text-[#717182] italic">(sans titre)</span>}
                      {p.published ? null : <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#FF8A00]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>BROUILLON</span>}
                    </div>
                  </div>
                </div>
              ),
            },
            { key: 'show', label: 'Émission', render: (p) => <span style={{ color: p.color, fontWeight: 600, fontSize: '0.78rem' }}>{p.show || '—'}</span>, width: '170px' },
            { key: 'duration', label: 'Durée', render: (p) => p.duration || '—', width: '90px' },
            { key: 'plays', label: 'Écoutes', render: (p) => p.plays || '—', width: '90px' },
            { key: 'section', label: 'Section', render: (p) => String(p.section), width: '120px' },
          ]}
          onEdit={(p) => { setEditing(p); setErrors({}); setNewRubric(''); }}
          onDelete={(p) => { remove(p.id); show('Épisode supprimé', 'info'); }}
          deleteLabel={(p) => `« ${p.title || 'sans titre'} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier l\'épisode' : 'Nouvel épisode'}
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

            {/* Statut */}
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
              <Select value={String(editing.section)} onChange={(v) => setEditing({ ...editing, section: v, show: '' })} options={SECTION_OPTIONS} />
            </Field>

            <div>
              <Field label="Émission / Rubrique" hint={`${sectionRubrics.length} rubrique${sectionRubrics.length > 1 ? 's' : ''} disponible${sectionRubrics.length > 1 ? 's' : ''}`}>
                <Select
                  value={editing.show}
                  onChange={(v) => setEditing({ ...editing, show: v })}
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

            <Field label="Durée" hint="ex. « 22 min »"><Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })}/></Field>
            <Field label="Écoutes" hint="ex. 1240 ou 12k"><Input value={editing.plays} onChange={(e) => setEditing({ ...editing, plays: e.target.value })}/></Field>

            <Field label="Couleur">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className="w-8 h-8" style={{ background: c, borderRadius: 8, border: editing.color === c ? '2px solid #1a1a1a' : '2px solid transparent' }} />
                ))}
              </div>
            </Field>
            <div />

            <div className="col-span-2">
              <Field label="Description" hint="Détails affichés sur la page de l'épisode">
                <Textarea
                  value={editing.body ?? ''}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder={`Description complète de l'épisode…\n\nSéparez les paragraphes par une ligne vide.`}
                  style={{ minHeight: 200, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}
                />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Pochette"><ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="1/1" /></Field>
            </div>
            <div className="col-span-2">
              <Field label="Fichier audio" hint="Importez un MP3 ou collez l'URL d'un flux audio.">
                <MediaUpload kind="audio" value={editing.audio ?? ''} onChange={(url) => setEditing({ ...editing, audio: url })} />
              </Field>
            </div>

            {/* Aperçu */}
            <div className="col-span-2">
              <div className="text-[#717182] mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>APERÇU</div>
              <div className="bg-white border border-[#EAEAEE] overflow-hidden" style={{ borderRadius: 12 }}>
                <div className="aspect-square bg-[#F0F0F4]" style={{ maxWidth: 220 }}>
                  {editing.image ? <img src={editing.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#9A9AA8]" style={{ fontSize: '0.82rem' }}>Aucune image</div>}
                </div>
                <div className="p-4">
                  <div className="inline-block px-2 py-0.5 mb-2" style={{ background: editing.color, color: 'white', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', borderRadius: 4 }}>
                    {(editing.show || 'ÉMISSION').toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                    {editing.title || <span className="text-[#9A9AA8]">Titre de l'épisode</span>}
                  </div>
                  <div className="mt-2 text-[#717182] flex items-center gap-2" style={{ fontSize: '0.72rem' }}>
                    {editing.duration && <span>{editing.duration}</span>}
                    {editing.duration && editing.plays && <span>·</span>}
                    {editing.plays && <span>{editing.plays} écoutes</span>}
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

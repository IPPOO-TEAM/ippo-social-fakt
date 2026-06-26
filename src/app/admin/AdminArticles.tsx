import { useState, useMemo } from 'react';
import { Eye, EyeOff, Plus, Send } from 'lucide-react';
import { useResource, type Article } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Textarea, Select, Modal, Btn, ImageUpload, exportCsv } from './ui';
import { useAllSections, useTaxonomy, rubricsFor, addRubric } from '../lib/taxonomy';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const COLORS = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2', '#1a1a1a'];

const empty = (): Article => ({
  id: `a${Date.now()}`,
  title: '',
  category: '',
  location: '',
  image: '',
  date: '',
  readTime: '',
  color: '#0066FF',
  excerpt: '',
  body: '',
  section: 'actu',
  published: false,
});

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function estimateReadTime(body: string, excerpt: string): string {
  const words = `${body} ${excerpt}`.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}

export function AdminArticles() {
  const { items, create, update, remove } = useResource<Article>('articles');
  const { show } = useAdminToast();
  const allSections = useAllSections();
  const SECTION_OPTIONS = useMemo(() => allSections.map((s) => ({ value: s.key, label: s.label })), [allSections]);
  const { state: taxonomy, commit: commitTaxonomy } = useTaxonomy();

  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Article | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Article, string>>>({});
  const [newRubric, setNewRubric] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((a) => {
      if (filterPublished === 'published' && !a.published) return false;
      if (filterPublished === 'draft' && a.published) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.location ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, search, filterPublished]);

  const onSave = (publish?: boolean) => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setErrors({ title: 'Le titre est requis.' });
      show('Le titre est requis.', 'error');
      return;
    }
    // Auto-remplissages utiles (jamais bloquants)
    const filled: Article = {
      ...editing,
      date: editing.date?.trim() || formatDateFR(new Date()),
      readTime: editing.readTime?.trim() || estimateReadTime(editing.body ?? '', editing.excerpt ?? ''),
      published: typeof publish === 'boolean' ? publish : (editing.published ?? false),
    };
    const isUpdate = items.some((a) => a.id === filled.id);
    if (isUpdate) update(filled.id, filled);
    else create(filled);
    setEditing(null);
    setErrors({});
    show(
      isUpdate
        ? (filled.published ? 'Article mis à jour et publié' : 'Brouillon mis à jour')
        : (filled.published ? 'Article publié' : 'Brouillon enregistré'),
      'success',
    );
  };

  const sectionRubrics = editing ? rubricsFor(taxonomy, String(editing.section)) : [];

  const addNewRubric = () => {
    if (!editing || !newRubric.trim()) return;
    commitTaxonomy(addRubric(taxonomy, String(editing.section), newRubric));
    setEditing({ ...editing, category: newRubric.trim() });
    setNewRubric('');
  };

  return (
    <>
      <PageHeader
        title="Articles"
        subtitle={`${items.length} article${items.length > 1 ? 's' : ''} · ${items.filter((a) => a.published).length} publié${items.filter((a) => a.published).length > 1 ? 's' : ''}`}
      />

      <div className="p-8">
        <Toolbar
          search={search}
          onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); setNewRubric(''); }}
          onExport={() => exportCsv('articles', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Titre' },
            { key: 'excerpt', label: 'Extrait' },
            { key: 'category', label: 'Rubrique' },
            { key: 'location', label: 'Lieu' },
            { key: 'section', label: 'Section' },
            { key: 'date', label: 'Date' },
            { key: 'readTime', label: 'Lecture' },
            { key: 'published', label: 'Publié' },
          ])}
          createLabel="Nouvel article"
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

        <Table<Article>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Titre',
              render: (a) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    {a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {a.title || <span className="text-[#717182] italic">(sans titre)</span>}
                      {a.published ? null : <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#FF8A00]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>BROUILLON</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#717182' }}>{(a.excerpt ?? '').slice(0, 70)}{(a.excerpt ?? '').length > 70 ? '…' : ''}</div>
                  </div>
                </div>
              ),
            },
            { key: 'category', label: 'Rubrique', render: (a) => <span style={{ color: a.color, fontWeight: 600, fontSize: '0.78rem' }}>{a.category || '—'}</span>, width: '160px' },
            { key: 'location', label: 'Lieu', render: (a) => a.location || '—', width: '120px' },
            { key: 'section', label: 'Section', render: (a) => String(a.section), width: '120px' },
            { key: 'date', label: 'Date', render: (a) => <span style={{ color: '#717182' }}>{a.date || '—'}</span>, width: '110px' },
          ]}
          onEdit={(a) => { setEditing(a); setErrors({}); setNewRubric(''); }}
          onDelete={(a) => { remove(a.id); show('Article supprimé', 'info'); }}
          deleteLabel={(a) => `« ${a.title || 'sans titre'} »`}
        />
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier l\'article' : 'Nouvel article'}
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

            <div className="col-span-2">
              <Field label="Titre *" hint={errors.title ?? 'Titre principal de l\'article'}>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }} placeholder="Ex. Cotonou inaugure son nouveau marché central" />
              </Field>
            </div>

            <Field label="Section">
              <Select value={String(editing.section)} onChange={(v) => setEditing({ ...editing, section: v, category: '' })} options={SECTION_OPTIONS} />
            </Field>

            <div>
              <Field label="Rubrique" hint={`${sectionRubrics.length} rubrique${sectionRubrics.length > 1 ? 's' : ''} disponible${sectionRubrics.length > 1 ? 's' : ''} dans cette section`}>
                <Select
                  value={editing.category}
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

            <div className="col-span-2">
              <Field label="Extrait" hint="Phrase d'accroche (carte de liste, partage social)">
                <Textarea value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Résumé court qui s'affiche sous le titre dans les listes." />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Corps de l'article" hint="Le texte affiché dans la page de l'article. Une ligne vide = nouveau paragraphe.">
                <Textarea
                  value={editing.body ?? ''}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder={`Tapez ici le contenu complet de l'article…\n\nSéparez les paragraphes par une ligne vide.`}
                  style={{ minHeight: 260, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}
                />
              </Field>
            </div>

            <Field label="Lieu (optionnel)">
              <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Cotonou, Parakou, Porto-Novo…" />
            </Field>
            <Field label="Date affichée (vide = aujourd'hui)">
              <Input value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} placeholder={formatDateFR(new Date())} />
            </Field>
            <Field label="Temps de lecture (vide = calcul auto)">
              <Input value={editing.readTime} onChange={(e) => setEditing({ ...editing, readTime: e.target.value })} placeholder={estimateReadTime(editing.body ?? '', editing.excerpt ?? '')} />
            </Field>

            <Field label="Couleur d'accent (rubrique)">
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: c })}
                    className="w-8 h-8 transition-transform hover:scale-110"
                    style={{ background: c, borderRadius: 8, border: editing.color === c ? '2px solid #1a1a1a' : '2px solid transparent' }}
                    aria-label={c}
                  />
                ))}
              </div>
            </Field>

            <div className="col-span-2">
              <Field label="Image de couverture" hint="Importez depuis votre appareil ou collez une URL. Format paysage recommandé.">
                <ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/8" />
              </Field>
            </div>

            {/* Aperçu */}
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
                    {editing.title || <span className="text-[#9A9AA8]">Titre de l'article</span>}
                  </div>
                  {editing.excerpt && (
                    <div className="mt-1.5 text-[#717182]" style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{editing.excerpt}</div>
                  )}
                  <div className="mt-2 text-[#717182] flex items-center gap-2" style={{ fontSize: '0.72rem' }}>
                    {editing.location && <span>{editing.location}</span>}
                    {editing.location && (editing.date || editing.readTime) && <span>·</span>}
                    {editing.date && <span>{editing.date}</span>}
                    {editing.readTime && <><span>·</span><span>{editing.readTime}</span></>}
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

// Confirm dialog supprimé : le « reset » du store admin n'a plus de sens
// (plus aucune donnée de démo à restaurer).
void ConfirmDialog;

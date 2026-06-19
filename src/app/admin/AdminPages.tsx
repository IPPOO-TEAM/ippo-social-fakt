import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Textarea, Modal, Btn, exportCsv } from './ui';
import { useAdminToast, ConfirmDialog } from './AdminToast';

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: number;
  published: boolean;
}

export const KEY_PAGES = 'ippoo:admin:pages';

export const seedPages: StaticPage[] = [
  {
    id: 'pg-cgu', slug: 'cgu', title: 'Conditions générales d\'utilisation',
    body: '## 1. Objet\n\nLes présentes CGU régissent l\'usage d\'IPPOO Social-Fact, plateforme communautaire d\'information.\n\n## 2. Compte utilisateur\n\nL\'inscription est libre et gratuite. L\'utilisateur s\'engage à fournir des informations exactes.\n\n## 3. Contenus publiés\n\nLes contributions citoyennes restent la propriété de leurs auteurs. IPPOO se réserve le droit de modérer.',
    updatedAt: Date.now(), published: true,
  },
  {
    id: 'pg-mentions', slug: 'mentions-legales', title: 'Mentions légales',
    body: '## Éditeur\n\nIPPOO Social-Fact SARL\nRCCM RB/COT/2024-B-12345\nCotonou, Bénin\n\n## Directeur de la publication\n\nRédaction IPPOO\n\n## Hébergement\n\nDonnées hébergées en zone CEDEAO.',
    updatedAt: Date.now(), published: true,
  },
  {
    id: 'pg-about', slug: 'a-propos', title: 'À propos d\'IPPOO',
    body: '## Notre mission\n\nFaire entendre les voix des territoires et des communautés africaines à travers une information de proximité, des podcasts, vidéos et services.\n\n## Notre équipe\n\nUne rédaction panafricaine basée à Cotonou, complétée par un réseau de correspondants terrain.',
    updatedAt: Date.now(), published: true,
  },
  {
    id: 'pg-faq', slug: 'faq', title: 'Foire aux questions',
    body: '## Comment m\'abonner ?\n\nDepuis l\'écran Profil, choisissez « Premium ».\n\n## Comment publier une tribune ?\n\nRubrique Communauté > Tribunes > Soumettre.\n\n## Comment signaler un contenu ?\n\nUtilisez le bouton « Signaler » présent sur chaque article ou commentaire.',
    updatedAt: Date.now(), published: true,
  },
];

export function loadPages(): StaticPage[] {
  if (typeof window === 'undefined') return seedPages;
  try {
    const raw = localStorage.getItem(KEY_PAGES);
    return raw ? (JSON.parse(raw) as StaticPage[]) : seedPages;
  } catch {
    return seedPages;
  }
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const empty = (): StaticPage => ({
  id: `pg-${Date.now()}`, slug: '', title: '', body: '', updatedAt: Date.now(), published: true,
});

export function AdminPages() {
  const { show } = useAdminToast();
  const [items, setItems] = useState<StaticPage[]>(() => loadPages());
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof StaticPage, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY_PAGES, JSON.stringify(items)); } catch { /* quota */ }
    window.dispatchEvent(new CustomEvent(`storage:${KEY_PAGES}`));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((p) => (p.title + p.slug).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof StaticPage, string>> = {};
    if (!editing.title.trim()) er.title = 'Titre requis.';
    if (!editing.slug.trim()) er.slug = 'Slug requis.';
    if (!/^[a-z0-9-]+$/.test(editing.slug)) er.slug = 'Lettres minuscules, chiffres et tirets uniquement.';
    if (items.some((p) => p.slug === editing.slug && p.id !== editing.id)) er.slug = 'Slug déjà utilisé.';
    if (!editing.body.trim()) er.body = 'Contenu requis.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const next = { ...editing, updatedAt: Date.now() };
    const isUpdate = items.some((p) => p.id === next.id);
    setItems(isUpdate ? items.map((p) => p.id === next.id ? next : p) : [next, ...items]);
    setEditing(null); setErrors({});
    show(isUpdate ? 'Page mise à jour' : 'Page créée', 'success');
  };

  const onRemove = (id: string) => {
    setItems(items.filter((p) => p.id !== id));
    show('Page supprimée', 'info');
  };

  return (
    <>
      <PageHeader title="Pages statiques" subtitle={`${items.length} pages · CGU, mentions, à propos, FAQ`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('pages', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'slug', label: 'Slug' },
            { key: 'title', label: 'Titre' },
            { key: 'published', label: 'Publié' },
            { key: 'updatedAt', label: 'Maj', get: (p) => new Date(p.updatedAt).toISOString() },
          ])}
          createLabel="Nouvelle page"
        />
        <Table<StaticPage>
          rows={filtered}
          columns={[
            {
              key: 'title', label: 'Page',
              render: (p) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#717182' }}>/{p.slug}</div>
                </div>
              ),
            },
            {
              key: 'published', label: 'Statut',
              render: (p) => (
                <span className="px-2 py-0.5" style={{
                  background: p.published ? '#E4F7E9' : '#F2F2F5',
                  color: p.published ? '#00A03B' : '#717182',
                  borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {p.published ? 'Publiée' : 'Brouillon'}
                </span>
              ),
              width: '110px',
            },
            { key: 'updatedAt', label: 'Maj', render: (p) => <span style={{ fontSize: '0.78rem', color: '#717182' }}>{new Date(p.updatedAt).toLocaleDateString('fr-FR')}</span>, width: '120px' },
          ]}
          onEdit={(p) => { setEditing(p); setErrors({}); }}
          onDelete={(p) => onRemove(p.id)}
          deleteLabel={(p) => `« ${p.title} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((p) => p.id === editing.id) ? 'Modifier la page' : 'Nouvelle page'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Titre *" hint={errors.title}><Input value={editing.title} maxLength={120} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} style={{ borderColor: errors.title ? '#D32F2F' : undefined }}/></Field></div>
            <div className="col-span-2"><Field label="Slug (URL) *" hint={errors.slug ?? `accessible via /pages/${editing.slug || '...'}`}><Input value={editing.slug} maxLength={60} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} style={{ borderColor: errors.slug ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Statut">
              <button type="button" onClick={() => setEditing({ ...editing, published: !editing.published })} className="px-3 py-2 w-full" style={{
                background: editing.published ? '#E4F7E9' : '#F2F2F5',
                color: editing.published ? '#00A03B' : '#717182',
                borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
              }}>
                {editing.published ? '● Publiée' : 'Brouillon'}
              </button>
            </Field>
            <div />
            <div className="col-span-2"><Field label="Contenu (Markdown) *" hint={errors.body ?? 'Utilisez ## pour les titres, **gras**, *italique*, listes…'}>
              <Textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} style={{ minHeight: 280, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '0.82rem', borderColor: errors.body ? '#D32F2F' : undefined }} />
            </Field></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les pages initiales ?"
        message="Vos modifications locales seront remplacées par les pages d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { localStorage.removeItem(KEY_PAGES); setItems(seedPages); setResetOpen(false); show('Pages réinitialisées', 'info'); }}
      />
    </>
  );
}

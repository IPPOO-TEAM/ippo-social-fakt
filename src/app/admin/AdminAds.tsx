import { useMemo, useState } from 'react';
import { Send, Eye, EyeOff, Image as ImageIcon, DownloadCloud } from 'lucide-react';
import { useResource } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Modal, Btn, ImageUpload, exportCsv } from './ui';
import { useAdminToast } from './AdminToast';
import { DEFAULT_ADS } from '../data/default-ads';

export interface Ad {
  id: string;
  brand: string;        // libellé court de la marque
  title: string;        // accroche principale
  cta: string;          // texte du bouton
  url: string;          // URL cible du clic (lien externe ou interne)
  image: string;        // image de fond
  tone: string;         // couleur de marque (dégradé overlay)
  published?: boolean;  // brouillon vs visible côté public
  order?: number;       // ordre d'affichage dans le carrousel
}

const PALETTE = ['#0066FF', '#FF8A00', '#00C853', '#FF3FA4', '#9B51E0', '#E8B21A', '#4A90E2', '#FFCB05', '#FF3B30', '#1a1a1a'];

const empty = (): Ad => ({
  id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  brand: '',
  title: '',
  cta: 'En savoir plus',
  url: '',
  image: '',
  tone: '#0066FF',
  published: false,
  order: Date.now(),
});

export function AdminAds() {
  const { items, create, update, remove } = useResource<Ad>('ads');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Ad | null>(null);
  const [errors, setErrors] = useState<{ brand?: string; title?: string }>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((a) => {
      if (filterPublished === 'published' && !a.published) return false;
      if (filterPublished === 'draft' && a.published) return false;
      if (!q) return true;
      return a.brand.toLowerCase().includes(q) || a.title.toLowerCase().includes(q);
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items, search, filterPublished]);

  const [seeding, setSeeding] = useState(false);
  // Pousse les encarts par défaut (images de marque + accroches) vers le
  // serveur. N'ajoute que ceux absents (par id) → idempotent, non destructif.
  const seedDefaults = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const existing = new Set(items.map((a) => a.id));
      const missing = DEFAULT_ADS.filter((a) => !existing.has(a.id));
      if (missing.length === 0) { show('Encarts par défaut déjà synchronisés.', 'info'); return; }
      for (const ad of missing) {
        await create({ ...ad });
      }
      show(`${missing.length} encart(s) par défaut synchronisé(s) et publié(s).`, 'success');
    } catch (e) {
      show(`Échec de la synchronisation : ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const onSave = (publish?: boolean) => {
    if (!editing) return;
    const er: { brand?: string; title?: string } = {};
    if (!editing.brand.trim()) er.brand = 'Marque requise.';
    if (!editing.title.trim()) er.title = 'Accroche requise.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Veuillez compléter marque et accroche.', 'error'); return; }
    const filled: Ad = { ...editing, published: typeof publish === 'boolean' ? publish : (editing.published ?? false) };
    const isUpdate = items.some((a) => a.id === filled.id);
    if (isUpdate) update(filled.id, filled);
    else create(filled);
    setEditing(null); setErrors({});
    show(
      isUpdate
        ? (filled.published ? 'Pub mise à jour et publiée' : 'Brouillon mis à jour')
        : (filled.published ? 'Pub publiée' : 'Brouillon enregistré'),
      'success',
    );
  };

  return (
    <>
      <PageHeader
        title="Carrousel publicitaire"
        subtitle={`${items.length} encart${items.length > 1 ? 's' : ''} · ${items.filter((a) => a.published).length} publié${items.filter((a) => a.published).length > 1 ? 's' : ''}`}
      />
      <div className="p-8">
        <Toolbar
          search={search}
          onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onExport={() => exportCsv('publicites', filtered, [
            { key: 'id', label: 'ID' }, { key: 'brand', label: 'Marque' }, { key: 'title', label: 'Accroche' },
            { key: 'cta', label: 'CTA' }, { key: 'url', label: 'URL' }, { key: 'published', label: 'Publié' },
          ])}
          createLabel="Nouvelle publicité"
        />

        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'published', 'draft'] as const).map((k) => {
            const active = filterPublished === k;
            return (
              <button key={k} onClick={() => setFilterPublished(k)} className="px-3 py-1.5" style={{
                background: active ? '#1a1a1a' : '#F4F4F6', color: active ? 'white' : '#717182',
                fontSize: '0.78rem', fontWeight: 600, borderRadius: 999,
              }}>
                {k === 'all' ? `Tous (${items.length})` : k === 'published' ? `Publiés (${items.filter((a) => a.published).length})` : `Brouillons (${items.filter((a) => !a.published).length})`}
              </button>
            );
          })}
          </div>
          <Btn onClick={seedDefaults} disabled={seeding}>
            <DownloadCloud size={13} /> {seeding ? 'Synchronisation…' : 'Synchroniser les encarts par défaut'}
          </Btn>
        </div>

        <Table<Ad>
          rows={filtered}
          columns={[
            {
              key: 'brand', label: 'Encart',
              render: (a) => (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 6 }}>
                    {a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#9A9AA8]"><ImageIcon size={14}/></div>}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      {a.brand || <span className="text-[#717182] italic">(sans marque)</span>}
                      {a.published ? null : <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#FF8A00]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>BROUILLON</span>}
                    </div>
                    <div className="line-clamp-1" style={{ fontSize: '0.72rem', color: '#717182' }}>{a.title}</div>
                  </div>
                </div>
              ),
            },
            { key: 'cta', label: 'CTA', render: (a) => <span style={{ fontSize: '0.78rem' }}>{a.cta}</span>, width: '120px' },
            { key: 'url', label: 'URL', render: (a) => <span className="line-clamp-1" style={{ fontSize: '0.74rem', color: '#0066FF' }}>{a.url || '—'}</span>, width: '180px' },
          ]}
          onEdit={(a) => { setEditing(a); setErrors({}); }}
          onDelete={(a) => { remove(a.id); show('Encart supprimé', 'info'); }}
          deleteLabel={(a) => `« ${a.brand || 'encart'} »`}
        />
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && items.some((a) => a.id === editing.id) ? 'Modifier l\'encart' : 'Nouvel encart publicitaire'}
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
            <div className="col-span-2 -mb-2">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[#FAFAFA]" style={{ borderRadius: 10 }}>
                {editing.published ? <Eye size={14} className="text-[#00A03B]"/> : <EyeOff size={14} className="text-[#FF8A00]"/>}
                <div className="flex-1" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {editing.published ? 'Publié — visible dans le carrousel' : 'Brouillon — invisible côté public'}
                </div>
                <button onClick={() => setEditing({ ...editing, published: !editing.published })} className="px-3 py-1.5" style={{
                  background: editing.published ? '#FFF3E0' : '#E4F7E9', color: editing.published ? '#FF8A00' : '#00A03B',
                  fontSize: '0.74rem', fontWeight: 700, borderRadius: 999,
                }}>
                  {editing.published ? 'Repasser en brouillon' : 'Marquer prêt à publier'}
                </button>
              </div>
            </div>

            <Field label="Marque *" hint={errors.brand}>
              <Input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} placeholder="Ex. Moov Africa" style={{ borderColor: errors.brand ? '#D32F2F' : undefined }} />
            </Field>
            <Field label="Bouton (CTA)">
              <Input value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} placeholder="En savoir plus" />
            </Field>

            <div className="col-span-2">
              <Field label="Accroche *" hint={errors.title}>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Ex. Pass internet illimités · 1500 F" style={{ borderColor: errors.title ? '#D32F2F' : undefined }} />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="URL cible" hint="Lien ouvert au clic. Externe (https://) ou interne (/services).">
                <Input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://…" />
              </Field>
            </div>

            <Field label="Couleur de marque (dégradé)">
              <div className="flex gap-1.5 flex-wrap">
                {PALETTE.map((c) => (
                  <button key={c} type="button" onClick={() => setEditing({ ...editing, tone: c })}
                    className="w-8 h-8 transition-transform hover:scale-110"
                    style={{ background: c, borderRadius: 8, border: editing.tone === c ? '2px solid #1a1a1a' : '2px solid transparent' }}
                    aria-label={c}/>
                ))}
              </div>
            </Field>

            <Field label="Ordre" hint="Plus petit = affiché en premier">
              <Input type="number" value={String(editing.order ?? 0)} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) || 0 })} />
            </Field>

            <div className="col-span-2">
              <Field label="Image (16:9 recommandé)">
                <ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} aspect="16/9" />
              </Field>
            </div>

            {/* Aperçu live */}
            <div className="col-span-2">
              <div className="text-[#717182] mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>APERÇU</div>
              <div className="relative overflow-hidden aspect-[16/9]" style={{ borderRadius: 12, background: '#0F0A1F' }}>
                {editing.image && <img src={editing.image} alt="" className="absolute inset-0 w-full h-full object-cover"/>}
                <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${editing.tone}E6 0%, ${editing.tone}80 45%, transparent 75%)` }}/>
                <div className="absolute inset-0 px-5 py-4 flex flex-col justify-between text-white">
                  <span className="self-start px-2 py-1 bg-white/25 backdrop-blur" style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', borderRadius: 999 }}>
                    {(editing.brand || 'MARQUE').toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2, maxWidth: '85%' }}>
                      {editing.title || 'Accroche de la publicité'}
                    </div>
                    <span className="inline-block mt-2 px-3 py-1.5 bg-white text-[#1a1a1a]" style={{ fontSize: '0.75rem', fontWeight: 700, borderRadius: 999 }}>
                      {editing.cta || 'CTA'}
                    </span>
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

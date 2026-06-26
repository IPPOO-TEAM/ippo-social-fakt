import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useResource, type PriceItem } from './store';
import { PageHeader } from './PageHeader';
import { Toolbar, Table, Field, Input, Select, Modal, Btn, exportCsv } from './ui';
import { formatFcfa, priceTrendPct, type PriceCategory } from '../data/mock';
import { useAdminToast, ConfirmDialog } from './AdminToast';

const CATEGORIES: { value: PriceCategory; label: string }[] = [
  { value: 'cereales', label: 'Céréales' },
  { value: 'frais', label: 'Frais' },
  { value: 'boissons', label: 'Boissons' },
  { value: 'epicerie', label: 'Épicerie' },
  { value: 'energie', label: 'Énergie' },
];

const empty = (): PriceItem => ({
  id: `p-${Date.now()}`,
  product: '',
  unit: 'kg',
  category: 'frais',
  price: 0,
  prev: 0,
  history: Array.from({ length: 12 }, () => 0),
  refMin: 0,
  refMax: 0,
  markets: [],
  source: 'Réseau IPPOO',
  updated: "à l'instant",
});

function TrendBadge({ p }: { p: PriceItem }) {
  const trend = priceTrendPct(p);
  const down = trend < -0.05;
  const flat = Math.abs(trend) <= 0.05;
  const tone = flat ? '#717182' : down ? '#00C853' : '#0066FF';
  const bg = flat ? '#F2F2F5' : down ? '#E5F8EC' : '#E5EFFF';
  const Icon = flat ? Minus : down ? TrendingDown : TrendingUp;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5" style={{ background: bg, color: tone, borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
      <Icon size={11} strokeWidth={2.5} />
      {Math.abs(trend).toFixed(1)}%
    </span>
  );
}

export function AdminPrices() {
  const { items, create, update, remove, reset } = useResource<PriceItem>('prices');
  const { show } = useAdminToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PriceItem, string>>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((p) => (p.product + p.category + p.source).toLowerCase().includes(q)) : items;
  }, [items, search]);

  const onSave = () => {
    if (!editing) return;
    const er: Partial<Record<keyof PriceItem, string>> = {};
    if (!editing.product.trim()) er.product = 'Produit requis.';
    setErrors(er);
    if (Object.keys(er).length > 0) { show('Champs invalides.', 'error'); return; }
    const last = editing.history[editing.history.length - 1] ?? editing.price;
    const normalized: PriceItem = {
      ...editing,
      history: last === editing.price ? editing.history : [...editing.history.slice(1), editing.price],
    };
    const isUpdate = items.some((p) => p.id === normalized.id);
    if (isUpdate) update(normalized.id, normalized); else create(normalized);
    setEditing(null); setErrors({});
    show(isUpdate ? 'Produit mis à jour' : 'Produit créé', 'success');
  };

  const updateMarket = (idx: number, patch: Partial<{ name: string; price: number }>) => {
    if (!editing) return;
    const next = editing.markets.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    setEditing({ ...editing, markets: next });
  };

  return (
    <>
      <PageHeader title="Prix & consommation" subtitle={`${items.length} produits suivis`} />
      <div className="p-8">
        <Toolbar
          search={search} onSearch={setSearch}
          onCreate={() => { setEditing(empty()); setErrors({}); }}
          onReset={() => setResetOpen(true)}
          onExport={() => exportCsv('prix', filtered, [
            { key: 'id', label: 'ID' },
            { key: 'product', label: 'Produit' },
            { key: 'category', label: 'Catégorie' },
            { key: 'unit', label: 'Unité' },
            { key: 'price', label: 'Prix (FCFA)' },
            { key: 'prev', label: 'Prix précédent' },
            { key: 'refMin', label: 'Min' },
            { key: 'refMax', label: 'Max' },
            { key: 'source', label: 'Source' },
            { key: 'updated', label: 'Mise à jour' },
            { key: 'markets', label: 'Marchés', get: (p) => p.markets.map((m) => `${m.name}:${m.price}`).join(' | ') },
          ])}
          createLabel="Nouveau produit"
        />
        <Table<PriceItem>
          rows={filtered}
          columns={[
            {
              key: 'product', label: 'Produit',
              render: (p) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{p.product}</div>
                  <div style={{ fontSize: '0.72rem', color: '#717182' }}>{p.source} · {p.updated}</div>
                </div>
              ),
            },
            { key: 'category', label: 'Catégorie', render: (p) => CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category, width: '120px' },
            { key: 'unit', label: 'Unité', render: (p) => `1 ${p.unit}`, width: '80px' },
            { key: 'price', label: 'Prix', render: (p) => <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>{formatFcfa(p.price)}</span>, width: '130px' },
            { key: 'trend', label: 'Tendance', render: (p) => <TrendBadge p={p} />, width: '100px' },
            { key: 'range', label: 'Min – Max', render: (p) => <span style={{ fontSize: '0.78rem', color: '#717182' }}>{p.refMin} – {p.refMax}</span>, width: '120px' },
          ]}
          onEdit={(p) => { setEditing(p); setErrors({}); }}
          onDelete={(p) => { remove(p.id); show('Produit supprimé', 'info'); }}
          deleteLabel={(p) => `« ${p.product} »`}
        />
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)}
        title={editing && items.some((p) => p.id === editing.id) ? 'Modifier le produit' : 'Nouveau produit'}
        footer={<><Btn onClick={() => setEditing(null)}>Annuler</Btn><Btn variant="primary" onClick={onSave}>Enregistrer</Btn></>}
      >
        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Nom du produit *" hint={errors.product}><Input value={editing.product} onChange={(e) => setEditing({ ...editing, product: e.target.value })} style={{ borderColor: errors.product ? '#D32F2F' : undefined }}/></Field></div>
            <Field label="Catégorie"><Select value={editing.category} onChange={(v) => setEditing({ ...editing, category: v as PriceCategory })} options={CATEGORIES} /></Field>
            <Field label="Unité *" hint={errors.unit}><Input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} style={{ borderColor: errors.unit ? '#D32F2F' : undefined }}/></Field>
            <Field label="Prix actuel (FCFA)" hint={errors.price}><Input type="number" min={0} value={String(editing.price)} onChange={(e) => setEditing({ ...editing, price: Math.max(0, Number(e.target.value) || 0) })} style={{ borderColor: errors.price ? '#D32F2F' : undefined }}/></Field>
            <Field label="Prix précédent (FCFA)" hint={errors.prev}><Input type="number" min={0} value={String(editing.prev)} onChange={(e) => setEditing({ ...editing, prev: Math.max(0, Number(e.target.value) || 0) })} style={{ borderColor: errors.prev ? '#D32F2F' : undefined }}/></Field>
            <Field label="Min observé" hint={errors.refMin}><Input type="number" min={0} value={String(editing.refMin)} onChange={(e) => setEditing({ ...editing, refMin: Math.max(0, Number(e.target.value) || 0) })} style={{ borderColor: errors.refMin ? '#D32F2F' : undefined }}/></Field>
            <Field label="Max observé" hint={errors.refMax}><Input type="number" min={0} value={String(editing.refMax)} onChange={(e) => setEditing({ ...editing, refMax: Math.max(0, Number(e.target.value) || 0) })} style={{ borderColor: errors.refMax ? '#D32F2F' : undefined }}/></Field>
            <Field label="Source"><Input value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} /></Field>
            <Field label="Mise à jour"><Input value={editing.updated} onChange={(e) => setEditing({ ...editing, updated: e.target.value })} /></Field>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1a1a' }}>Relevés par marché</div>
                <Btn onClick={() => setEditing({ ...editing, markets: [...editing.markets, { name: '', price: 0 }] })}>Ajouter un marché</Btn>
              </div>
              <div className="space-y-2">
                {editing.markets.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={m.name} onChange={(e) => updateMarket(i, { name: e.target.value })} placeholder="Nom du marché" />
                    <Input type="number" value={String(m.price)} onChange={(e) => updateMarket(i, { price: Number(e.target.value) || 0 })} placeholder="Prix" />
                    <Btn variant="danger" onClick={() => setEditing({ ...editing, markets: editing.markets.filter((_, j) => j !== i) })}>Suppr.</Btn>
                  </div>
                ))}
                {editing.markets.length === 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#717182' }}>Aucun relevé. Ajoutez au moins un marché pour comparer les prix.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        title="Restaurer les données initiales ?"
        message="Vos modifications locales seront remplacées par le jeu de prix d'exemple."
        confirmLabel="Restaurer"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { reset(); setResetOpen(false); show('Prix réinitialisés', 'info'); }}
      />
    </>
  );
}

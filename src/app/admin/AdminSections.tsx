import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Field, Input, Btn } from './ui';
import { sections } from '../data/sections';
import type { SectionKey } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';

export interface SectionConfig {
  key: SectionKey;
  labelOverride?: string;
  shortOverride?: string;
  hidden?: boolean;
  order: number;
}

export const KEY_SECTIONS = 'ippoo:admin:sections';

const DEFAULT_CONFIG: SectionConfig[] = sections.map((s, i) => ({ key: s.key, order: i }));

export function loadSectionConfig(): SectionConfig[] {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY_SECTIONS);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as SectionConfig[];
    // Reconcile new sections from code that don't exist in saved config
    const merged = [...parsed];
    sections.forEach((s) => { if (!merged.some((c) => c.key === s.key)) merged.push({ key: s.key, order: merged.length }); });
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function AdminSectionsPage() {
  const { show } = useAdminToast();
  const [items, setItems] = useState<SectionConfig[]>(() => loadSectionConfig());
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY_SECTIONS, JSON.stringify(items)); } catch { /* quota */ }
    window.dispatchEvent(new CustomEvent(`storage:${KEY_SECTIONS}`));
  }, [items]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next.map((it, i) => ({ ...it, order: i })));
  };

  const toggleHidden = (key: SectionKey) => {
    setItems(items.map((it) => (it.key === key ? { ...it, hidden: !it.hidden } : it)));
  };

  const setLabel = (key: SectionKey, value: string, field: 'labelOverride' | 'shortOverride') => {
    setItems(items.map((it) => (it.key === key ? { ...it, [field]: value || undefined } : it)));
  };

  return (
    <>
      <PageHeader
        title="Sections de l'app"
        subtitle="Réordonner, renommer ou masquer les rubriques de la barre de navigation"
        actions={<Btn onClick={() => setResetOpen(true)}><RotateCcw size={13} /> Réinitialiser</Btn>}
      />
      <div className="p-8 max-w-3xl">
        <div className="bg-white border border-[#EAEAEE] divide-y divide-[#EAEAEE]" style={{ borderRadius: 12 }}>
          {items.map((cfg, i) => {
            const meta = sections.find((s) => s.key === cfg.key);
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={cfg.key} className="px-5 py-4 flex items-start gap-4">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-6 flex items-center justify-center hover:bg-[#F0F0F4] disabled:opacity-30" style={{ borderRadius: 4 }}>
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="w-7 h-6 flex items-center justify-center hover:bg-[#F0F0F4] disabled:opacity-30" style={{ borderRadius: 4 }}>
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1A`, borderRadius: 10 }}>
                  <Icon size={18} style={{ color: meta.color }} strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex items-center justify-between">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{cfg.labelOverride || meta.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#717182' }}>clé : <code>{cfg.key}</code> · ordre {i + 1}</div>
                    </div>
                    <button
                      onClick={() => toggleHidden(cfg.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5"
                      style={{
                        background: cfg.hidden ? '#FEEAEA' : '#E4F7E9',
                        color: cfg.hidden ? '#D32F2F' : '#00A03B',
                        borderRadius: 999, fontSize: '0.74rem', fontWeight: 700,
                      }}
                    >
                      {cfg.hidden ? <><EyeOff size={12} /> Masquée</> : <><Eye size={12} /> Visible</>}
                    </button>
                  </div>
                  <Field label="Libellé long">
                    <Input value={cfg.labelOverride ?? ''} placeholder={meta.label} maxLength={40} onChange={(e) => setLabel(cfg.key, e.target.value, 'labelOverride')} />
                  </Field>
                  <Field label="Libellé court (nav)">
                    <Input value={cfg.shortOverride ?? ''} placeholder={meta.short} maxLength={16} onChange={(e) => setLabel(cfg.key, e.target.value, 'shortOverride')} />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 px-4 py-3 bg-[#E5EFFF]" style={{ fontSize: '0.78rem', color: '#0052CC', borderRadius: 8 }}>
          Astuce : les sections masquées disparaissent de la barre de navigation utilisateur, mais leurs contenus restent accessibles via lien direct.
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Réinitialiser les sections ?"
        message="L'ordre, les libellés et la visibilité reviendront aux valeurs d'origine."
        confirmLabel="Réinitialiser"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { localStorage.removeItem(KEY_SECTIONS); setItems(DEFAULT_CONFIG); setResetOpen(false); show('Sections réinitialisées', 'info'); }}
      />
    </>
  );
}

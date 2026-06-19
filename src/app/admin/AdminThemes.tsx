import { useEffect, useState } from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Field, Input, Btn } from './ui';
import { themes, type WellbeingTheme } from '../data/wellbeing';
import { useAdminToast, ConfirmDialog } from './AdminToast';

export interface ThemeOverride {
  key: WellbeingTheme;
  labelOverride?: string;
  colorOverride?: string;
  bgOverride?: string;
  hidden?: boolean;
}

export const KEY_THEMES = 'ippoo:admin:wb-themes';

const PALETTE = ['#FF8A00', '#FF3FA4', '#0066FF', '#9B51E0', '#4A4A55', '#00C853', '#E8B21A', '#4A90E2', '#D32F2F', '#00A89C'];
const BG_PALETTE = ['#FFE9D4', '#FFE0F2', '#DFF0FF', '#EFE4FF', '#F0F0F4', '#D4F4E0', '#FFF6D9', '#FEEAEA', '#D5F4F0'];

const DEFAULT_OVERRIDES: ThemeOverride[] = themes.map((t) => ({ key: t.key }));

export function loadThemeOverrides(): ThemeOverride[] {
  if (typeof window === 'undefined') return DEFAULT_OVERRIDES;
  try {
    const raw = localStorage.getItem(KEY_THEMES);
    if (!raw) return DEFAULT_OVERRIDES;
    const parsed = JSON.parse(raw) as ThemeOverride[];
    const merged = [...parsed];
    themes.forEach((t) => { if (!merged.some((c) => c.key === t.key)) merged.push({ key: t.key }); });
    return merged;
  } catch {
    return DEFAULT_OVERRIDES;
  }
}

export function AdminThemes() {
  const { show } = useAdminToast();
  const [items, setItems] = useState<ThemeOverride[]>(() => loadThemeOverrides());
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY_THEMES, JSON.stringify(items)); } catch { /* quota */ }
    window.dispatchEvent(new CustomEvent(`storage:${KEY_THEMES}`));
  }, [items]);

  const update = (key: WellbeingTheme, patch: Partial<ThemeOverride>) => {
    setItems(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  return (
    <>
      <PageHeader
        title="Thèmes Bien-Être"
        subtitle="Personnaliser les libellés et couleurs des thèmes (famille, deuil, solitude…)"
        actions={<Btn onClick={() => setResetOpen(true)}><RotateCcw size={13} /> Réinitialiser</Btn>}
      />
      <div className="p-8 max-w-4xl">
        <div className="grid gap-3">
          {items.map((cfg) => {
            const meta = themes.find((t) => t.key === cfg.key);
            if (!meta) return null;
            const Icon = meta.icon;
            const label = cfg.labelOverride || meta.label;
            const color = cfg.colorOverride || meta.color;
            const bg = cfg.bgOverride || meta.bg;
            return (
              <div key={cfg.key} className="bg-white border border-[#EAEAEE] p-4" style={{ borderRadius: 12 }}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 flex items-center justify-center" style={{ background: bg, borderRadius: 12 }}>
                      <Icon size={20} style={{ color }} strokeWidth={2.4} />
                    </div>
                    <span className="px-2 py-0.5" style={{ background: bg, color, borderRadius: 999, fontSize: '0.68rem', fontWeight: 700 }}>
                      {label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex items-center justify-between">
                      <div style={{ fontSize: '0.74rem', color: '#717182' }}>clé : <code>{cfg.key}</code></div>
                      <button
                        onClick={() => update(cfg.key, { hidden: !cfg.hidden })}
                        className="flex items-center gap-1.5 px-3 py-1.5"
                        style={{
                          background: cfg.hidden ? '#FEEAEA' : '#E4F7E9',
                          color: cfg.hidden ? '#D32F2F' : '#00A03B',
                          borderRadius: 999, fontSize: '0.74rem', fontWeight: 700,
                        }}
                      >
                        {cfg.hidden ? <><EyeOff size={12} /> Masqué</> : <><Eye size={12} /> Visible</>}
                      </button>
                    </div>
                    <div className="col-span-2"><Field label="Libellé">
                      <Input value={cfg.labelOverride ?? ''} placeholder={meta.label} maxLength={40} onChange={(e) => update(cfg.key, { labelOverride: e.target.value || undefined })} />
                    </Field></div>
                    <Field label="Couleur d'accent">
                      <div className="flex gap-1.5 flex-wrap">
                        {PALETTE.map((c) => (
                          <button key={c} type="button" onClick={() => update(cfg.key, { colorOverride: c === meta.color ? undefined : c })} className="w-8 h-8" style={{ background: c, borderRadius: 8, border: color === c ? '2px solid #1a1a1a' : '2px solid transparent' }} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Fond pastel">
                      <div className="flex gap-1.5 flex-wrap">
                        {BG_PALETTE.map((c) => (
                          <button key={c} type="button" onClick={() => update(cfg.key, { bgOverride: c === meta.bg ? undefined : c })} className="w-8 h-8" style={{ background: c, borderRadius: 8, border: bg === c ? '2px solid #1a1a1a' : '2px solid #EAEAEE' }} />
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 px-4 py-3 bg-[#FFF6D9]" style={{ fontSize: '0.78rem', color: '#7C5400', borderRadius: 8 }}>
          Les icônes sont fixées par le code (cohérence visuelle). Pour ajouter un nouveau thème, contactez l'équipe technique.
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Réinitialiser les thèmes ?"
        message="Tous les libellés et couleurs reviendront aux valeurs d'origine."
        confirmLabel="Réinitialiser"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { localStorage.removeItem(KEY_THEMES); setItems(DEFAULT_OVERRIDES); setResetOpen(false); show('Thèmes réinitialisés', 'info'); }}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw, Plus, X, Trash2, Layers } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Field, Input, Btn } from './ui';
import { sections, sectionMap } from '../data/sections';
import type { SectionKey } from '../data/sections';
import { useAdminToast, ConfirmDialog } from './AdminToast';
import {
  useTaxonomy, useAllSections, rubricsFor,
  addRubric, removeRubric, addCustomSection, removeCustomSection, slugify,
} from '../lib/taxonomy';

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
    // Reconcile nouvelles sections (code OU custom) absentes du config sauvegardé.
    const merged = [...parsed];
    sections.forEach((s) => { if (!merged.some((c) => c.key === s.key)) merged.push({ key: s.key, order: merged.length }); });
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_CONFIG;
  }
}

const PALETTE = ['#0066FF', '#FF3FA4', '#00C853', '#E8B21A', '#9B51E0', '#FF8A00', '#4A90E2', '#1a1a1a'];

export function AdminSectionsPage() {
  const { show } = useAdminToast();
  const allSections = useAllSections();
  const allSectionsMap = useMemo(() => Object.fromEntries(allSections.map((s) => [s.key, s])), [allSections]);
  const { state: taxonomy, commit: commitTaxonomy } = useTaxonomy();

  const [items, setItems] = useState<SectionConfig[]>(() => loadSectionConfig());
  const [resetOpen, setResetOpen] = useState(false);
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [deleteSectionKey, setDeleteSectionKey] = useState<string | null>(null);

  // Réconcilie automatiquement la liste avec les sections custom ajoutées.
  useEffect(() => {
    setItems((prev) => {
      const merged = [...prev];
      let changed = false;
      taxonomy.customSections.forEach((cs) => {
        if (!merged.some((c) => c.key === cs.key)) {
          merged.push({ key: cs.key as SectionKey, order: merged.length });
          changed = true;
        }
      });
      // Supprime les configs orphelines (section custom supprimée).
      const knownKeys = new Set([...sections.map((s) => s.key), ...taxonomy.customSections.map((c) => c.key)]);
      const filtered = merged.filter((c) => knownKeys.has(c.key));
      if (filtered.length !== merged.length) changed = true;
      return changed ? filtered.map((it, i) => ({ ...it, order: i })) : prev;
    });
  }, [taxonomy.customSections]);

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

  const toggleHidden = (key: string) => {
    setItems(items.map((it) => (it.key === key ? { ...it, hidden: !it.hidden } : it)));
  };

  const setLabel = (key: string, value: string, field: 'labelOverride' | 'shortOverride') => {
    setItems(items.map((it) => (it.key === key ? { ...it, [field]: value || undefined } : it)));
  };

  return (
    <>
      <PageHeader
        title="Sections & rubriques"
        subtitle="Créer, réordonner, renommer et organiser la taxonomie de la plateforme"
        actions={
          <>
            <Btn onClick={() => setNewSectionOpen(true)}><Plus size={13}/> Nouvelle section</Btn>
            <Btn onClick={() => setResetOpen(true)}><RotateCcw size={13} /> Réinitialiser</Btn>
          </>
        }
      />
      <div className="p-8 max-w-3xl space-y-4">
        {items.map((cfg, i) => {
          const meta = allSectionsMap[cfg.key];
          if (!meta) return null;
          const Icon = meta.icon;
          const isCustom = taxonomy.customSections.some((cs) => cs.key === cfg.key);
          const rubs = rubricsFor(taxonomy, cfg.key);
          return (
            <div key={cfg.key} className="bg-white border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-6 flex items-center justify-center hover:bg-[#F0F0F4] disabled:opacity-30" style={{ borderRadius: 4 }} aria-label="Monter">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="w-7 h-6 flex items-center justify-center hover:bg-[#F0F0F4] disabled:opacity-30" style={{ borderRadius: 4 }} aria-label="Descendre">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1A`, borderRadius: 10 }}>
                  <Icon size={18} style={{ color: meta.color }} strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {cfg.labelOverride || meta.label}
                        {isCustom && <span className="px-1.5 py-0.5 bg-[#E5EFFF] text-[#0066FF]" style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 4 }}>CUSTOM</span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#717182' }}>clé : <code>{cfg.key}</code> · ordre {i + 1} · {rubs.length} rubrique{rubs.length > 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
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
                      {isCustom && (
                        <button onClick={() => setDeleteSectionKey(cfg.key)} className="w-8 h-8 flex items-center justify-center hover:bg-[#FEEAEA] text-[#D32F2F]" style={{ borderRadius: 8 }} aria-label="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <Field label="Libellé long">
                    <Input value={cfg.labelOverride ?? ''} placeholder={meta.label} onChange={(e) => setLabel(cfg.key, e.target.value, 'labelOverride')} />
                  </Field>
                  <Field label="Libellé court (nav)">
                    <Input value={cfg.shortOverride ?? ''} placeholder={meta.short} onChange={(e) => setLabel(cfg.key, e.target.value, 'shortOverride')} />
                  </Field>
                </div>
              </div>

              {/* Rubriques de la section */}
              <div className="px-5 pb-4 pl-[5.25rem]">
                <div className="text-[#717182] mb-2 flex items-center gap-1.5" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  <Layers size={11} /> RUBRIQUES
                </div>
                <RubricEditor
                  sectionKey={cfg.key}
                  rubrics={rubs}
                  onAdd={(label) => commitTaxonomy(addRubric(taxonomy, cfg.key, label))}
                  onRemove={(label) => commitTaxonomy(removeRubric(taxonomy, cfg.key, label))}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-4 px-4 py-3 bg-[#E5EFFF]" style={{ fontSize: '0.78rem', color: '#0052CC', borderRadius: 8 }}>
          Astuce : les rubriques ajoutées ici sont immédiatement disponibles dans les éditeurs d'articles, d'épisodes et de vidéos.
        </div>
      </div>

      <NewSectionDialog
        open={newSectionOpen}
        onClose={() => setNewSectionOpen(false)}
        onCreate={(s) => {
          commitTaxonomy(addCustomSection(taxonomy, s));
          setNewSectionOpen(false);
          show(`Section « ${s.label} » créée`, 'success');
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Réinitialiser les sections ?"
        message="L'ordre, les libellés et la visibilité reviendront aux valeurs d'origine. Les sections personnalisées et les rubriques ajoutées ne sont pas affectées."
        confirmLabel="Réinitialiser"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { localStorage.removeItem(KEY_SECTIONS); setItems(DEFAULT_CONFIG); setResetOpen(false); show('Sections réinitialisées', 'info'); }}
      />

      <ConfirmDialog
        open={!!deleteSectionKey}
        title="Supprimer cette section ?"
        message="Les rubriques associées seront également supprimées. Les contenus déjà publiés dans cette section ne seront pas effacés mais ne s'afficheront plus dans la navigation."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setDeleteSectionKey(null)}
        onConfirm={() => {
          if (deleteSectionKey) {
            commitTaxonomy(removeCustomSection(taxonomy, deleteSectionKey));
            show('Section supprimée', 'info');
          }
          setDeleteSectionKey(null);
        }}
      />
    </>
  );
}

function RubricEditor({ sectionKey: _sectionKey, rubrics, onAdd, onRemove }: {
  sectionKey: string; rubrics: string[]; onAdd: (label: string) => void; onRemove: (label: string) => void;
}) {
  const [input, setInput] = useState('');
  const submit = () => { if (input.trim()) { onAdd(input); setInput(''); } };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {rubrics.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-[#F4F4F6] text-[#1a1a1a]" style={{ fontSize: '0.74rem', fontWeight: 600, borderRadius: 999 }}>
            {r}
            <button onClick={() => onRemove(r)} className="w-5 h-5 flex items-center justify-center hover:bg-white" style={{ borderRadius: 999 }} aria-label={`Supprimer ${r}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        {rubrics.length === 0 && (
          <span className="text-[#717182]" style={{ fontSize: '0.78rem' }}>Aucune rubrique pour l'instant.</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          placeholder="Ajouter une rubrique…"
          className="flex-1 px-3 py-2 bg-white border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
          style={{ borderRadius: 8, fontSize: '0.82rem' }}
        />
        <Btn onClick={submit}><Plus size={13}/> Ajouter</Btn>
      </div>
    </div>
  );
}

function NewSectionDialog({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void;
  onCreate: (s: { key: string; label: string; short: string; color: string; description?: string }) => void;
}) {
  const [label, setLabel] = useState('');
  const [short, setShort] = useState('');
  const [key, setKey] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) setKey(slugify(label));
  }, [label, touched]);
  useEffect(() => { if (open) { setLabel(''); setShort(''); setKey(''); setColor(PALETTE[0]); setDescription(''); setTouched(false); } }, [open]);

  const collision = !!(key && sectionMap[key as SectionKey]);
  const canSubmit = label.trim() && key.trim() && !collision;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white" style={{ borderRadius: 14 }}>
        <div className="px-5 py-4 border-b border-[#EAEAEE] flex items-center justify-between">
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem' }}>Nouvelle section</div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-[#F0F0F4]" style={{ borderRadius: 999 }}><X size={16}/></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Libellé"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Diaspora" /></Field>
          <Field label="Libellé court (nav)"><Input value={short} onChange={(e) => setShort(e.target.value)} placeholder="Diaspora" /></Field>
          <Field label="Identifiant (slug)" hint={collision ? '⚠️ Conflit avec une section existante' : 'lettres minuscules, chiffres, tirets'}>
            <Input value={key} onChange={(e) => { setTouched(true); setKey(slugify(e.target.value)); }} placeholder="diaspora" style={{ borderColor: collision ? '#D32F2F' : undefined }} />
          </Field>
          <Field label="Couleur d'accent">
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8" style={{ background: c, borderRadius: 8, outline: color === c ? '2px solid #1a1a1a' : 'none', outlineOffset: 2 }} aria-label={c}/>
              ))}
            </div>
          </Field>
          <Field label="Description (optionnel)">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Une phrase pour décrire la section" />
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-[#EAEAEE] flex items-center justify-end gap-2">
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" disabled={!canSubmit} onClick={() => canSubmit && onCreate({
            key, label: label.trim(), short: short.trim() || label.trim(), color, description: description.trim() || undefined,
          })}>
            Créer la section
          </Btn>
        </div>
      </div>
    </div>
  );
}

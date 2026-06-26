/* Taxonomie dynamique IPPOO Social-Fact.
 * ============================================================
 * Source de vérité unique pour :
 *   - les sections (statiques en code + sections personnalisées créées par l'admin)
 *   - les rubriques par section (override des rubriques code + ajouts admin)
 *
 * Persistance : un seul blob JSON dans `localStorage` (back-office) qui est
 * également poussé sur le serveur via /config/taxonomy. Un événement custom
 * (`storage:ippoo:taxonomy`) déclenche le rafraîchissement des composants.
 *
 * Pourquoi pas une table dédiée ? Le volume est minime (<5 Ko), et le
 * back-office a besoin d'un commit transactionnel (ajouter une section + sa
 * première rubrique). app_config + un blob unique suffit.
 */
import { useEffect, useState, useCallback } from 'react';
import { sections as baseSections, sectionMap, type Section, type SectionKey } from '../data/sections';
import { rubriques as baseRubriques } from '../data/mock';
import { getConfig, setConfig } from './api';
import { Grid3x3 } from 'lucide-react';

export interface CustomSection {
  key: string;          // slug
  label: string;
  short: string;
  color: string;
  description?: string;
}

export interface TaxonomyState {
  /** Rubriques par section (admin-editable, surcharge le code). */
  rubricsBySection: Record<string, string[]>;
  /** Sections créées par l'admin (en plus de celles définies en code). */
  customSections: CustomSection[];
}

const KEY = 'ippoo:taxonomy';
const SERVER_KEY = 'taxonomy';
const EVT = `storage:${KEY}`;

const DEFAULT: TaxonomyState = { rubricsBySection: {}, customSections: [] };

function loadLocal(): TaxonomyState {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<TaxonomyState>;
    return {
      rubricsBySection: parsed.rubricsBySection ?? {},
      customSections: parsed.customSections ?? [],
    };
  } catch {
    return DEFAULT;
  }
}

function saveLocal(state: TaxonomyState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* quota */
  }
}

/** Rubriques par défaut d'une section : `rubrics` du code (Section) si présent,
 * sinon la liste globale `rubriques` (Actu) en repli pour les sections legacy. */
function defaultRubricsFor(key: string): string[] {
  const meta = sectionMap[key as SectionKey];
  if (meta?.rubrics?.length) return meta.rubrics.map((r) => r.label);
  return baseRubriques.map((r: { label: string }) => r.label);
}

/* ============================== HOOKS ============================== */

export function useTaxonomy() {
  const [state, setState] = useState<TaxonomyState>(() => loadLocal());

  useEffect(() => {
    const refresh = () => setState(loadLocal());
    const cross = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    window.addEventListener(EVT, refresh);
    window.addEventListener('storage', cross);
    // Hydratation initiale depuis le serveur (best-effort).
    (async () => {
      try {
        const remote = await getConfig<TaxonomyState>(SERVER_KEY);
        if (remote && typeof remote === 'object') {
          saveLocal({
            rubricsBySection: remote.rubricsBySection ?? {},
            customSections: remote.customSections ?? [],
          });
        }
      } catch { /* serveur indispo, on garde le cache local */ }
    })();
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener('storage', cross);
    };
  }, []);

  /** Persiste localement ET pousse au serveur (fire-and-forget). */
  const commit = useCallback((next: TaxonomyState) => {
    setState(next);
    saveLocal(next);
    void setConfig(SERVER_KEY, next).catch(() => undefined);
  }, []);

  return { state, commit };
}

/** Liste des rubriques effectives pour une section (overrides admin > code). */
export function rubricsFor(state: TaxonomyState, sectionKey: string): string[] {
  return state.rubricsBySection[sectionKey] ?? defaultRubricsFor(sectionKey);
}

/** Hook simple pour les composants qui n'ont besoin que des rubriques d'une section. */
export function useRubricsFor(sectionKey: string): string[] {
  const { state } = useTaxonomy();
  return rubricsFor(state, sectionKey);
}

/** Sections résolues : code + custom, dans l'ordre code puis custom à la fin.
 * Le tri/visibilité reste géré par useResolvedSections (admin-overrides.ts). */
export function useAllSections(): Section[] {
  const { state } = useTaxonomy();
  const custom: Section[] = state.customSections.map((c) => ({
    key: c.key as SectionKey,
    label: c.label,
    short: c.short,
    icon: Grid3x3,
    color: c.color,
    description: c.description ?? '',
    hero: '',
    rubrics: (state.rubricsBySection[c.key] ?? []).map((label) => ({ label })),
  }));
  return [...baseSections, ...custom];
}

/* ============================== MUTATIONS ============================== */

export function addRubric(state: TaxonomyState, sectionKey: string, label: string): TaxonomyState {
  const cleaned = label.trim();
  if (!cleaned) return state;
  const current = state.rubricsBySection[sectionKey] ?? defaultRubricsFor(sectionKey);
  if (current.includes(cleaned)) return state;
  return {
    ...state,
    rubricsBySection: { ...state.rubricsBySection, [sectionKey]: [...current, cleaned] },
  };
}

export function removeRubric(state: TaxonomyState, sectionKey: string, label: string): TaxonomyState {
  const current = state.rubricsBySection[sectionKey] ?? defaultRubricsFor(sectionKey);
  return {
    ...state,
    rubricsBySection: { ...state.rubricsBySection, [sectionKey]: current.filter((r) => r !== label) },
  };
}

export function renameRubric(state: TaxonomyState, sectionKey: string, oldLabel: string, newLabel: string): TaxonomyState {
  const cleaned = newLabel.trim();
  if (!cleaned) return state;
  const current = state.rubricsBySection[sectionKey] ?? defaultRubricsFor(sectionKey);
  return {
    ...state,
    rubricsBySection: {
      ...state.rubricsBySection,
      [sectionKey]: current.map((r) => (r === oldLabel ? cleaned : r)),
    },
  };
}

export function addCustomSection(state: TaxonomyState, section: CustomSection): TaxonomyState {
  if (sectionMap[section.key as SectionKey]) return state; // collision avec une section code
  if (state.customSections.some((s) => s.key === section.key)) return state;
  return { ...state, customSections: [...state.customSections, section] };
}

export function removeCustomSection(state: TaxonomyState, key: string): TaxonomyState {
  const rest = { ...state.rubricsBySection };
  delete rest[key];
  return {
    customSections: state.customSections.filter((s) => s.key !== key),
    rubricsBySection: rest,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 32);
}

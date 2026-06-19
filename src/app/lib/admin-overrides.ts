import { useEffect, useState } from 'react';
import { sections, sectionMap, type Section, type SectionKey } from '../data/sections';
import { themes, type WellbeingTheme } from '../data/wellbeing';
import { loadSectionConfig, KEY_SECTIONS, type SectionConfig } from '../admin/AdminSections';
import { loadThemeOverrides, KEY_THEMES, type ThemeOverride } from '../admin/AdminThemes';
import { loadPages, KEY_PAGES, type StaticPage } from '../admin/AdminPages';

function useSyncedStore<T>(key: string, loader: () => T): T {
  const [state, setState] = useState<T>(() => loader());
  useEffect(() => {
    const refresh = () => setState(loader());
    const cross = (e: StorageEvent) => { if (e.key === key) refresh(); };
    window.addEventListener(`storage:${key}`, refresh);
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(`storage:${key}`, refresh);
      window.removeEventListener('storage', cross);
    };
    // loader and key are intentionally stable per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export interface ResolvedSection extends Section {
  hidden: boolean;
  order: number;
}

export function useResolvedSections(): ResolvedSection[] {
  const config = useSyncedStore<SectionConfig[]>(KEY_SECTIONS, loadSectionConfig);
  return config
    .filter((c) => sectionMap[c.key])
    .map((c) => {
      const base = sectionMap[c.key];
      return {
        ...base,
        label: c.labelOverride || base.label,
        short: c.shortOverride || base.short,
        hidden: Boolean(c.hidden),
        order: c.order,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export type ResolvedWellbeingTheme = typeof themes[number] & { hidden: boolean };

export function useResolvedThemes(): ResolvedWellbeingTheme[] {
  const overrides = useSyncedStore<ThemeOverride[]>(KEY_THEMES, loadThemeOverrides);
  return themes.map((t) => {
    const o = overrides.find((x) => x.key === t.key);
    return {
      ...t,
      label: o?.labelOverride || t.label,
      color: o?.colorOverride || t.color,
      bg: o?.bgOverride || t.bg,
      hidden: Boolean(o?.hidden),
    };
  });
}

export function useResolvedThemeMap(): Record<WellbeingTheme, ResolvedWellbeingTheme> {
  const list = useResolvedThemes();
  return list.reduce((acc, t) => { acc[t.key] = t; return acc; }, {} as Record<WellbeingTheme, ResolvedWellbeingTheme>);
}

export function usePublicPages(): StaticPage[] {
  const all = useSyncedStore<StaticPage[]>(KEY_PAGES, loadPages);
  return all.filter((p) => p.published);
}

export function usePublicPage(slug: string | undefined): StaticPage | null {
  const pages = usePublicPages();
  if (!slug) return null;
  return pages.find((p) => p.slug === slug) ?? null;
}

export { sections };

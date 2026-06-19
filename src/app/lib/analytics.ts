// Lightweight, privacy-respecting page-view tracker.
// Uses Plausible's `manual` mode so we control pageview timing in SPA routes.
// No script is loaded unless `VITE_PLAUSIBLE_DOMAIN` is set, which keeps dev
// and self-hosted deployments fully analytics-free by default.

const SCRIPT_ID = 'plausible-script';

declare global {
  interface Window {
    plausible?: ((event: string, opts?: { props?: Record<string, string | number | boolean>; u?: string }) => void) & {
      q?: unknown[];
    };
  }
}

function getDomain(): string | null {
  const d = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_PLAUSIBLE_DOMAIN;
  return d && d.trim() ? d.trim() : null;
}

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  const domain = getDomain();
  if (!domain) return;
  if (document.getElementById(SCRIPT_ID)) return;
  // Respect Do Not Track. The Plausible script also honors DNT, but we skip
  // injection entirely so no third-party request is even made.
  if (navigator.doNotTrack === '1') return;
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.defer = true;
  s.dataset.domain = domain;
  s.src = 'https://plausible.io/js/script.manual.js';
  document.head.appendChild(s);
  window.plausible = window.plausible || function (...args: unknown[]) {
    (window.plausible!.q = window.plausible!.q || []).push(args);
  } as Window['plausible'];
}

export function trackPageview(url?: string): void {
  if (typeof window === 'undefined' || !window.plausible) return;
  window.plausible('pageview', url ? { u: url } : undefined);
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined' || !window.plausible) return;
  window.plausible(name, props ? { props } : undefined);
}

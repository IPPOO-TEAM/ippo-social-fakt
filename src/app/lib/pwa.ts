// Runtime injection of PWA manifest and meta tags.
// In this environment the index.html is auto-generated, so we can't edit it
// directly. We add the required tags at runtime instead. A full service worker
// must be added at the deployment layer (Vite plugin or hosting platform).

const MANIFEST = {
  name: 'IPPOO Social-Fact',
  short_name: 'IPPOO',
  description: 'Le média communautaire africain : audio, vidéo et écrit.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#ffffff',
  theme_color: '#0066FF',
  lang: 'fr',
  categories: ['news', 'social', 'lifestyle'],
  icons: [
    {
      src:
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#0066FF"/><text x="96" y="120" font-family="Montserrat,sans-serif" font-weight="800" font-size="78" fill="white" text-anchor="middle" letter-spacing="-3">IP</text></svg>`,
        ),
      sizes: '192x192',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
    {
      src:
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0066FF"/><text x="256" y="320" font-family="Montserrat,sans-serif" font-weight="800" font-size="208" fill="white" text-anchor="middle" letter-spacing="-8">IP</text></svg>`,
        ),
      sizes: '512x512',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
};

function ensureMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureLink(rel: string, href: string, type?: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  if (type) el.setAttribute('type', type);
}

let installed = false;
export function installPwaMeta() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  try {
    const blob = new Blob([JSON.stringify(MANIFEST)], { type: 'application/manifest+json' });
    const url = URL.createObjectURL(blob);
    ensureLink('manifest', url, 'application/manifest+json');
  } catch { /* ignore */ }

  ensureMeta('theme-color', '#0066FF');
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'default');
  ensureMeta('apple-mobile-web-app-title', 'IPPOO');
  ensureMeta('mobile-web-app-capable', 'yes');
  ensureMeta('format-detection', 'telephone=no');
  ensureMeta('description', MANIFEST.description);

  // Open Graph for shares
  ensureMeta('og:title', MANIFEST.name, 'property');
  ensureMeta('og:description', MANIFEST.description, 'property');
  ensureMeta('og:type', 'website', 'property');

  // Apple touch icon
  ensureLink(
    'apple-touch-icon',
    'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="40" fill="#0066FF"/><text x="90" y="113" font-family="Montserrat,sans-serif" font-weight="800" font-size="74" fill="white" text-anchor="middle" letter-spacing="-3">IP</text></svg>`,
      ),
  );
}

export function updateThemeColor(color: string) {
  ensureMeta('theme-color', color);
}

export function updateHtmlLang(lang: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

// Register the Service Worker shipped at /sw.js (built from public/sw.ts).
// Required for offline shell + Web Push. Silent no-op in environments
// where SW is unavailable (HTTP, sandbox, file://).
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (e) {
    // Expected in dev/sandbox without SW serving.
    console.log(`Service worker registration skipped: ${e}`);
    return null;
  }
}

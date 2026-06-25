// Runtime injection of PWA manifest and meta tags.
// In this environment the index.html is auto-generated, so we can't edit it
// directly. We add the required tags at runtime instead. A full service worker
// must be added at the deployment layer (Vite plugin or hosting platform).

import appIconUrl from '../../imports/SOCIAL_FAKTS.png';

// Le nom de la plateforme sert de nom d'application.
const APP_NAME = 'IPPOO Social-Fact';
const APP_SHORT_NAME = 'Social Fakts';
const APP_DESCRIPTION = 'Le média communautaire béninois : actualités, podcasts, vidéos, radio en direct, opportunités, prix marchés.';
const ICON_BG = '#ffffff';

// Construit le manifest. `maskableSrc` est une version « paddée » de l'icône
// (logo centré sur fond avec marge de sécurité) pour qu'elle ne soit PAS
// rognée quand le système applique un masque rond/squircle à l'installation.
function buildManifest(maskableSrc: string) {
  return {
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: ICON_BG,
    theme_color: '#0066FF',
    lang: 'fr',
    categories: ['news', 'social', 'lifestyle'],
    icons: [
      // Icône pleine (non masquée) : affichée telle quelle, jamais rognée.
      { src: appIconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: appIconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Icône maskable avec zone de sécurité : c'est elle qui est utilisée
      // pour l'icône d'installation sur Android, sans couper le logo.
      { src: maskableSrc, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Dessine l'icône centrée sur un carré avec marge, et renvoie un data URL PNG.
// `scale` = proportion occupée par le logo (0.72 = ~14% de marge de chaque
// côté, conforme à la zone de sécurité maskable des PWA).
async function makePaddedIcon(size: number, scale: number): Promise<string | null> {
  try {
    const img = await loadImage(appIconUrl);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = ICON_BG;
    ctx.fillRect(0, 0, size, size);
    const inner = Math.round(size * scale);
    const offset = Math.round((size - inner) / 2);
    ctx.drawImage(img, offset, offset, inner, inner);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

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

  ensureMeta('theme-color', '#0066FF');
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'default');
  ensureMeta('apple-mobile-web-app-title', APP_SHORT_NAME);
  ensureMeta('application-name', APP_NAME);
  ensureMeta('mobile-web-app-capable', 'yes');
  ensureMeta('format-detection', 'telephone=no');
  ensureMeta('description', APP_DESCRIPTION);
  ensureMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1');
  ensureMeta('author', APP_NAME);
  ensureMeta('keywords', 'Bénin, actualités Bénin, média béninois, podcasts, vidéos, radio en direct, opportunités, prix marchés, Cotonou, Afrique, IPPOO');

  // Open Graph for shares
  ensureMeta('og:title', APP_NAME, 'property');
  ensureMeta('og:description', APP_DESCRIPTION, 'property');
  ensureMeta('og:type', 'website', 'property');
  ensureMeta('og:site_name', APP_NAME, 'property');
  ensureMeta('og:locale', 'fr_BJ', 'property');
  ensureMeta('twitter:card', 'summary_large_image');
  ensureMeta('twitter:title', APP_NAME);
  ensureMeta('twitter:description', APP_DESCRIPTION);

  // Favicon immédiat (icône pleine, non rognée dans l'onglet).
  ensureLink('icon', appIconUrl, 'image/png');
  // Repli apple-touch-icon avant génération de la version paddée.
  ensureLink('apple-touch-icon', appIconUrl);

  // Génère les icônes paddées (zone de sécurité) puis branche le manifest et
  // l'apple-touch-icon pour éviter tout rognage à l'installation.
  void (async () => {
    const maskable = (await makePaddedIcon(512, 0.72)) ?? appIconUrl;
    const appleIcon = (await makePaddedIcon(180, 0.86)) ?? appIconUrl;
    try {
      const manifest = buildManifest(maskable);
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
      ensureLink('manifest', URL.createObjectURL(blob), 'application/manifest+json');
    } catch { /* ignore */ }
    ensureLink('apple-touch-icon', appleIcon);
  })();
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

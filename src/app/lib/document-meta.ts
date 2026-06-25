import { useEffect } from 'react';

export interface DocumentMeta {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other' | 'music.song';
  // Mots-clés ciblés pour la page (référencement + crawlers IA).
  keywords?: string;
  // JSON-LD structured data (NewsArticle, PodcastEpisode, etc.) — passed
  // through as-is and injected as a <script type="application/ld+json">.
  jsonLd?: Record<string, unknown>;
}

const SITE = 'IPPOO Social-Fact';
const DEFAULT_DESCRIPTION = 'Le média communautaire béninois : actualités, podcasts, vidéos, radio en direct, opportunités, prix marchés.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=1200&q=80';
const DEFAULT_KEYWORDS = 'Bénin, actualités Bénin, média béninois, podcasts Bénin, vidéos Bénin, radio en direct, opportunités Bénin, prix marchés, Cotonou, Porto-Novo, Afrique, IPPOO';

// 13 langues supportées par la plateforme (codes BCP-47 pour hreflang).
const SUPPORTED_LANGS = ['fr', 'en', 'fon', 'yo', 'wo', 'ha', 'ig', 'ln', 'bm', 'ff', 'dyu', 'sef', 'dje'] as const;

function setMeta(selector: string, attrName: 'name' | 'property', attrValue: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Liens alternates hreflang : signale aux moteurs que la même URL sert
// les 13 langues. Le contenu est rendu côté client selon la préférence
// utilisateur, donc toutes les langues pointent vers l'URL courante + une
// version x-default (français).
const HREFLANG_CLASS = 'ippoo-hreflang';
function setHreflangAlternates(url: string) {
  document.head
    .querySelectorAll(`link.${HREFLANG_CLASS}`)
    .forEach((el) => el.remove());
  const add = (hreflang: string) => {
    const el = document.createElement('link');
    el.className = HREFLANG_CLASS;
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    el.setAttribute('href', url);
    document.head.appendChild(el);
  };
  SUPPORTED_LANGS.forEach(add);
  add('x-default');
}

const JSONLD_ID = 'ippoo-jsonld';
function setJsonLd(data: Record<string, unknown> | undefined) {
  const existing = document.getElementById(JSONLD_ID);
  if (!data) { existing?.remove(); return; }
  const el = (existing as HTMLScriptElement | null) ?? document.createElement('script');
  el.id = JSONLD_ID;
  (el as HTMLScriptElement).type = 'application/ld+json';
  el.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(el);
}

export function useDocumentMeta(meta: DocumentMeta | null | undefined) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Pas de meta fournie : on laisse la baseline (installée par pwa.ts /
    // installSiteStructuredData) en place plutôt que d'écraser la meta d'une
    // page enfant. Les effets parent s'exécutant après ceux des enfants, ceci
    // évite que le layout n'efface la meta d'une page de détail.
    if (!meta) return;
    const title = meta?.title ? `${meta.title} · ${SITE}` : SITE;
    const description = meta?.description ?? DEFAULT_DESCRIPTION;
    const image = meta?.image ?? DEFAULT_IMAGE;
    const url = meta?.url ?? window.location.href;
    const type = meta?.type ?? 'website';

    const prevTitle = document.title;
    document.title = title;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    setMeta('meta[name="keywords"]', 'name', 'keywords', meta?.keywords ?? DEFAULT_KEYWORDS);
    setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');
    setMeta('meta[name="author"]', 'name', 'author', SITE);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'fr_BJ');
    setLink('canonical', url);
    setHreflangAlternates(url);
    setJsonLd(meta?.jsonLd);

    return () => {
      document.title = prevTitle;
      // Leaving the meta tags in place is fine: the next route's hook will
      // overwrite them. Only the JSON-LD must be cleared so stale schema
      // doesn't leak into pages without their own structured data.
      setJsonLd(undefined);
    };
  }, [meta?.title, meta?.description, meta?.image, meta?.url, meta?.type, meta?.keywords, meta?.jsonLd]);
}

// Données structurées au niveau du site (Organisation + WebSite avec
// SearchAction). Injectées une seule fois au démarrage via un <script>
// dédié — distinct du JSON-LD par page pour ne pas être écrasées au
// changement de route. Améliore le knowledge panel et la compréhension
// de la marque par les moteurs et les assistants IA.
const SITE_JSONLD_ID = 'ippoo-site-jsonld';
export function installSiteStructuredData() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SITE_JSONLD_ID)) return;
  const origin = window.location.origin;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: SITE,
        url: origin,
        description: DEFAULT_DESCRIPTION,
        logo: { '@type': 'ImageObject', url: `${origin}/icon-512.png` },
        foundingLocation: {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressCountry: 'BJ', addressLocality: 'Cotonou' },
        },
        areaServed: { '@type': 'Country', name: 'Bénin' },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: SITE,
        description: DEFAULT_DESCRIPTION,
        inLanguage: SUPPORTED_LANGS as unknown as string[],
        publisher: { '@id': `${origin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
  const el = document.createElement('script');
  el.id = SITE_JSONLD_ID;
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

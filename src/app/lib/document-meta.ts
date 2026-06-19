import { useEffect } from 'react';

export interface DocumentMeta {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other' | 'music.song';
  // JSON-LD structured data (NewsArticle, PodcastEpisode, etc.) — passed
  // through as-is and injected as a <script type="application/ld+json">.
  jsonLd?: Record<string, unknown>;
}

const SITE = 'IPPOO Social-Fact';
const DEFAULT_DESCRIPTION = 'Le média communautaire béninois : actualités, podcasts, vidéos, radio en direct, opportunités, prix marchés.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=1200&q=80';

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
    setLink('canonical', url);
    setJsonLd(meta?.jsonLd);

    return () => {
      document.title = prevTitle;
      // Leaving the meta tags in place is fine: the next route's hook will
      // overwrite them. Only the JSON-LD must be cleared so stale schema
      // doesn't leak into pages without their own structured data.
      setJsonLd(undefined);
    };
  }, [meta?.title, meta?.description, meta?.image, meta?.url, meta?.type, meta?.jsonLd]);
}

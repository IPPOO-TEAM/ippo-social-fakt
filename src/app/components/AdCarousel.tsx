import { useEffect, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLiveContent } from '../lib/live-content';
import type { Ad } from '../admin/AdminAds';

export function AdCarousel() {
  // Server-only : les encarts proviennent de la table publique (resource `ad`).
  // Seuls les éléments `published === true` sont affichés.
  const { items: rawAds } = useLiveContent<Ad>('ad');
  const ads = rawAds
    .filter((a) => a && a.published && (a.image || a.title))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || ads.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 4000);
    return () => clearInterval(t);
  }, [paused, ads.length]);

  useEffect(() => {
    // Recale l'index si le nombre d'éléments change (suppression, etc.).
    if (index >= ads.length) setIndex(0);
  }, [ads.length, index]);

  if (ads.length === 0) return null;

  const goto = (i: number) => setIndex((i + ads.length) % ads.length);
  const onAdClick = (a: Ad) => {
    if (!a.url) return;
    if (/^https?:\/\//i.test(a.url)) window.open(a.url, '_blank', 'noopener,noreferrer');
    else window.location.href = a.url;
  };

  return (
    <section
      className="px-5 mt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em' }}>
          SPONSORISÉ
        </span>
        <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
          {index + 1}/{ads.length}
        </span>
      </div>

      <div className="relative overflow-hidden" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 10px 28px -18px rgba(0,0,0,0.30)' }}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {ads.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onAdClick(a)}
              className="relative flex-shrink-0 w-full aspect-[16/9] text-left"
            >
              {a.image && (
                <ImageWithFallback src={a.image} alt={a.brand} className="absolute inset-0 w-full h-full object-cover"/>
              )}
              <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${a.tone}E6 0%, ${a.tone}80 45%, transparent 75%)` }}/>
              <div className="absolute inset-0 px-5 py-4 flex flex-col justify-between text-white">
                <span className="self-start px-2 py-1 bg-white/25 backdrop-blur" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', borderRadius: 999 }}>
                  {(a.brand || '').toUpperCase()}
                </span>
                <div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em', lineHeight: 1.2, maxWidth: '85%' }}>
                    {a.title}
                  </div>
                  {a.cta && (
                    <span className="inline-block mt-2 px-3 py-1.5 bg-white text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, borderRadius: 999 }}>
                      {a.cta}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {ads.length > 1 && (
          <>
            <button onClick={() => goto(index - 1)} aria-label="Précédent"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur text-white flex items-center justify-center"
              style={{ borderRadius: 999 }}>‹</button>
            <button onClick={() => goto(index + 1)} aria-label="Suivant"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur text-white flex items-center justify-center"
              style={{ borderRadius: 999 }}>›</button>
          </>
        )}
      </div>

      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {ads.map((_, i) => (
            <button key={i} onClick={() => goto(i)} aria-label={`Aller à la pub ${i + 1}`}
              className="transition-all"
              style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 999, background: i === index ? '#0066FF' : '#E5E5EA' }}/>
          ))}
        </div>
      )}
    </section>
  );
}

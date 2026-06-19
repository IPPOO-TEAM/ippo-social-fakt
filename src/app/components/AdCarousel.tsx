import { useEffect, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Ad {
  id: string;
  brand: string;
  title: string;
  cta: string;
  image: string;
  tone: string;
}

const ads: Ad[] = [
  { id: 'ad1',  brand: 'Wave',         title: 'Envoyez sans frais, partout en CI', cta: 'Télécharger',     image: 'https://images.unsplash.com/photo-1643963033484-930d2f4754b5?w=1200&q=80', tone: '#0066FF' },
  { id: 'ad2',  brand: 'Orange Money', title: 'Recharges & paiements en 1 clic',    cta: 'Activer',         image: 'https://images.unsplash.com/photo-1545966337-264a393808a3?w=1200&q=80', tone: '#FF8A00' },
  { id: 'ad3',  brand: 'Yango',        title: 'Vos courses livrées à la maison',    cta: 'Commander',       image: 'https://images.unsplash.com/photo-1756373199421-05de9257aefd?w=1200&q=80', tone: '#FF3FA4' },
  { id: 'ad4',  brand: 'MTN',          title: 'Pass internet illimités · 1500 F',   cta: 'Souscrire',       image: 'https://images.unsplash.com/photo-1673286410308-800c508d8d55?w=1200&q=80', tone: '#FFCB05' },
  { id: 'ad5',  brand: 'Jumia',        title: 'Black Days · jusqu\'à -70%',         cta: 'En profiter',     image: 'https://images.unsplash.com/photo-1553724625-6f84f9074bb4?w=1200&q=80', tone: '#F68B1E' },
  { id: 'ad6',  brand: 'Coris Bank',   title: 'Compte jeune sans frais',            cta: 'Ouvrir',          image: 'https://images.unsplash.com/photo-1753820579679-48f30846dd5d?w=1200&q=80', tone: '#9B51E0' },
  { id: 'ad7',  brand: 'Ivoire Coton', title: 'Pagne Wax authentique · arrivage',   cta: 'Découvrir',       image: 'https://images.unsplash.com/photo-1773858437808-509ceef36d67?w=1200&q=80', tone: '#00C853' },
  { id: 'ad8',  brand: 'AfricaPay',    title: 'Payez vos factures en 30 secondes',  cta: 'Essayer',         image: 'https://images.unsplash.com/photo-1558642905-4e2d983ce8d4?w=1200&q=80', tone: '#0066FF' },
  { id: 'ad9',  brand: 'Sotra',        title: 'Bus & taxis : nouvelle appli',       cta: 'Installer',       image: 'https://images.unsplash.com/photo-1708347456810-a5c430588790?w=1200&q=80', tone: '#FF3FA4' },
  { id: 'ad10', brand: 'Sunu Assur.',  title: 'Santé famille à partir de 5000 F',   cta: 'Devis gratuit',   image: 'https://images.unsplash.com/photo-1651800314574-25ae6cfd1da0?w=1200&q=80', tone: '#00C853' },
  { id: 'ad11', brand: 'Canal+',       title: 'Le sport en direct, partout',        cta: 'S\'abonner',      image: 'https://images.unsplash.com/photo-1623412911489-124caf88ff20?w=1200&q=80', tone: '#FF3B30' },
  { id: 'ad12', brand: 'Kiri Kiri',    title: 'Poulet braisé livré chaud',          cta: 'Commander',       image: 'https://images.unsplash.com/photo-1747774999354-c24aabc57775?w=1200&q=80', tone: '#FF8A00' },
  { id: 'ad13', brand: 'Bio Market',   title: 'Fruits & légumes locaux, frais',     cta: 'Voir les offres', image: 'https://images.unsplash.com/photo-1773858437478-667cca0ed8cf?w=1200&q=80', tone: '#00C853' },
  { id: 'ad14', brand: 'Vlisco',       title: 'Collection 2026 disponible',         cta: 'Boutique',        image: 'https://images.unsplash.com/photo-1558642911-d587891a9430?w=1200&q=80', tone: '#9B51E0' },
  { id: 'ad15', brand: 'Glovo',        title: 'Livraison gratuite ce week-end',     cta: 'Commander',       image: 'https://images.unsplash.com/flagged/photo-1598898471446-213b4abb132f?w=1200&q=80', tone: '#FFCB05' },
  { id: 'ad16', brand: 'Air Côte d\'Ivoire', title: 'Vols intérieurs dès 35 000 F',  cta: 'Réserver',       image: 'https://images.unsplash.com/photo-1607656304037-49ad16c8d2cb?w=1200&q=80', tone: '#0066FF' },
  { id: 'ad17', brand: 'Ecobank',      title: 'Crédit instantané pour PME',         cta: 'Simuler',         image: 'https://images.unsplash.com/photo-1586437474999-0fccfae90418?w=1200&q=80', tone: '#0066FF' },
  { id: 'ad18', brand: 'CIE',          title: 'Compteur prépayé chez vous',         cta: 'En savoir +',     image: 'https://images.unsplash.com/photo-1775642674140-2b197f7b8904?w=1200&q=80', tone: '#FF8A00' },
  { id: 'ad19', brand: 'Solibra',      title: 'Boissons fraîches, livrées au coin', cta: 'Trouver',         image: 'https://images.unsplash.com/photo-1609833419641-50f35e86e2ba?w=1200&q=80', tone: '#FF3FA4' },
  { id: 'ad20', brand: 'AgroFrais',    title: 'Marché en ligne pour producteurs',   cta: 'Rejoindre',       image: 'https://images.unsplash.com/photo-1625191824758-e00b2c51f388?w=1200&q=80', tone: '#00C853' },
];

export function AdCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 4000);
    return () => clearInterval(t);
  }, [paused]);

  const goto = (i: number) => setIndex((i + ads.length) % ads.length);

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
              onClick={() => window.open('#', '_self')}
              className="relative flex-shrink-0 w-full aspect-[16/9] text-left"
            >
              <ImageWithFallback src={a.image} alt={a.brand} className="absolute inset-0 w-full h-full object-cover"/>
              <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${a.tone}E6 0%, ${a.tone}80 45%, transparent 75%)` }}/>
              <div className="absolute inset-0 px-5 py-4 flex flex-col justify-between text-white">
                <span className="self-start px-2 py-1 bg-white/25 backdrop-blur" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', borderRadius: 999 }}>
                  {a.brand.toUpperCase()}
                </span>
                <div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em', lineHeight: 1.2, maxWidth: '85%' }}>
                    {a.title}
                  </div>
                  <span className="inline-block mt-2 px-3 py-1.5 bg-white text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, borderRadius: 999 }}>
                    {a.cta}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => goto(index - 1)}
          aria-label="Précédent"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur text-white flex items-center justify-center"
          style={{ borderRadius: 999 }}
        >
          ‹
        </button>
        <button
          onClick={() => goto(index + 1)}
          aria-label="Suivant"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur text-white flex items-center justify-center"
          style={{ borderRadius: 999 }}
        >
          ›
        </button>
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => goto(i)}
            aria-label={`Aller à la pub ${i + 1}`}
            className="transition-all"
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: i === index ? '#0066FF' : '#E5E5EA',
            }}
          />
        ))}
      </div>
    </section>
  );
}

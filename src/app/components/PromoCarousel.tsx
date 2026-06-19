import { ChevronLeft, ChevronRight, Gift, TreePine, Briefcase, Users, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const promos = [
  { title: 'Plus Grand Arbre de Noël', subtitle: 'Événement exceptionnel', tag: 'ÉVÉNEMENT', color: 'from-[#00C853] to-[#4A90E2]', icon: TreePine },
  { title: 'Packs de Cadeaux', subtitle: 'Abonnements premium', tag: 'OFFRE', color: 'from-[#E8B21A] to-[#FF8A00]', icon: Gift },
  { title: 'Organisation d\'Événements', subtitle: 'Services professionnels', tag: 'SERVICE', color: 'from-[#FF3FA4] to-[#B57CFF]', icon: Users },
  { title: 'Support & Accompagnement', subtitle: 'Assistance 24/7', tag: 'SUPPORT', color: 'from-[#4A90E2] to-[#00C853]', icon: Briefcase },
];

export function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % promos.length);
  const prev = () => setCurrentIndex((p) => (p - 1 + promos.length) % promos.length);

  return (
    <section className="relative max-w-7xl mx-auto px-5 sm:px-6 py-16 md:py-20">
      <div className="flex items-end justify-between mb-8 md:mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE5E3] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#0066FF', letterSpacing: '0.1em' }}>OFFRES SPÉCIALES</span>
          </div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            À ne pas manquer
          </h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button onClick={prev} className="w-11 h-11 rounded-full bg-white border border-[#EFEFEF] hover:border-[#0066FF] hover:text-[#0066FF] transition-all flex items-center justify-center" aria-label="Previous">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button onClick={next} className="w-11 h-11 rounded-full bg-[#0066FF] text-white hover:scale-105 transition-all flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(255,68,54,0.6)]" aria-label="Next">
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px]">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {promos.map((promo, index) => (
            <div key={index} className="min-w-full">
              <div className={`bg-gradient-to-br ${promo.color} rounded-[28px] p-7 sm:p-10 md:p-14 text-white relative overflow-hidden min-h-[320px] md:min-h-[380px] flex flex-col justify-end`}>
                <div className="absolute top-0 right-0 opacity-15 -translate-y-6 translate-x-6">
                  <promo.icon size={220} strokeWidth={1.2} />
                </div>
                <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/15 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20">
                      <promo.icon size={26} strokeWidth={2.5} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em' }}>
                      {promo.tag}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {promo.title}
                  </h3>
                  <p className="mb-6" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', opacity: 0.9 }}>
                    {promo.subtitle}
                  </p>
                  <button className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] pl-5 pr-2 py-2 rounded-full hover:scale-105 transition-all" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
                    Découvrir
                    <span className="w-7 h-7 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">
                      <ArrowUpRight size={14} />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-2">
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-[#0066FF]' : 'w-2 bg-[#E5E5E5]'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <div className="flex sm:hidden gap-2">
          <button onClick={prev} className="w-10 h-10 rounded-full bg-white border border-[#EFEFEF] flex items-center justify-center" aria-label="Previous">
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button onClick={next} className="w-10 h-10 rounded-full bg-[#0066FF] text-white flex items-center justify-center" aria-label="Next">
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

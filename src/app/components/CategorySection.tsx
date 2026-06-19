import { Radio, Users2, Briefcase, GraduationCap, Heart, TrendingUp, Globe, ShoppingBag } from 'lucide-react';

const categories = [
  { icon: Radio, name: 'Podcast & Vidéos', color: '#0066FF', bg: '#FFE5E3' },
  { icon: TrendingUp, name: 'Actualités', color: '#FF8A00', bg: '#FFE9D4' },
  { icon: Users2, name: 'Témoignages', color: '#FF3FA4', bg: '#FFE0F2' },
  { icon: Briefcase, name: 'Secteur Informel', color: '#00C853', bg: '#D4F4E0' },
  { icon: GraduationCap, name: 'Jeunes & Académie', color: '#4A90E2', bg: '#DFF0FF' },
  { icon: Heart, name: 'Santé & Bien-être', color: '#E8B21A', bg: '#FFF6D9' },
  { icon: ShoppingBag, name: 'Consommation', color: '#B57CFF', bg: '#F2E8FF' },
  { icon: Globe, name: 'Société', color: '#00C853', bg: '#D4F4E0' },
];

export function CategorySection() {
  return (
    <section className="py-16 md:py-20 px-5 sm:px-6" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EFEFEF] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#FF8A00', letterSpacing: '0.1em' }}>EXPLOREZ</span>
          </div>
          <h2 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Nos Rubriques
          </h2>
          <p className="text-[#717182] max-w-md mx-auto" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Des contenus organisés pour vous accompagner au quotidien.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((category, index) => (
            <button
              key={index}
              className="group bg-white rounded-2xl p-5 sm:p-6 text-left border border-[#F0F0F0] hover:border-transparent hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                style={{ backgroundColor: category.bg }}
              >
                <category.icon size={24} style={{ color: category.color }} strokeWidth={2.5} />
              </div>
              <h4 className="mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                {category.name}
              </h4>
              <span className="inline-block transition-all duration-300 group-hover:translate-x-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: category.color, fontWeight: 600 }}>
                Explorer →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

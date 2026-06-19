import { Users, Radio, BookOpen, Star } from 'lucide-react';

const stats = [
  { icon: Users, value: '50K+', label: 'Abonnés actifs', color: '#0066FF', bg: '#FFE5E3' },
  { icon: Radio, value: '200+', label: 'Épisodes publiés', color: '#FF8A00', bg: '#FFE9D4' },
  { icon: BookOpen, value: '15+', label: 'Rubriques', color: '#00C853', bg: '#D4F4E0' },
  { icon: Star, value: '4.9', label: 'Note moyenne /5', color: '#E8B21A', bg: '#FFF6D9' },
];

export function Stats() {
  return (
    <section className="py-12 md:py-16 px-5 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#FAFAFA] to-white rounded-[28px] border border-[#F0F0F0] p-6 sm:p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center md:text-left group">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: stat.bg }}
                >
                  <stat.icon size={22} style={{ color: stat.color }} strokeWidth={2.5} />
                </div>
                <div className="mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

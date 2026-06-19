import { ImageWithFallback } from './figma/ImageWithFallback';
import { Play, Clock, Calendar } from 'lucide-react';

const episodes = [
  {
    title: 'Entrepreneuriat Féminin en Afrique',
    category: 'Témoignages',
    duration: '25 min',
    date: '20 Avr 2026',
    image: 'https://images.unsplash.com/photo-1666867540898-aaa1993ffabc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    color: '#FF3FA4',
  },
  {
    title: 'Veille Économique - Marchés Locaux',
    category: 'Actualités',
    duration: '18 min',
    date: '18 Avr 2026',
    image: 'https://images.unsplash.com/photo-1642257834579-eee89ff3e9fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    color: '#FF8A00',
  },
  {
    title: 'Innovation dans le Secteur Informel',
    category: 'Podcast',
    duration: '30 min',
    date: '15 Avr 2026',
    image: 'https://images.unsplash.com/photo-1632800237110-f9c87acc2222?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    color: '#00C853',
  },
];

export function RecentEpisodes() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#1a1a1a' }}>
              Derniers Épisodes
            </h2>
            <p className="text-[#717182] mt-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem' }}>
              Découvrez nos contenus les plus récents
            </p>
          </div>
          <button className="hidden md:block text-[#0066FF] hover:text-[#FF8A00] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
            Voir tout →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {episodes.map((episode, index) => (
            <div
              key={index}
              className="bg-white rounded-[24px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={episode.image}
                  alt={episode.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                    style={{ backgroundColor: episode.color }}
                  >
                    <Play size={28} color="white" fill="white" />
                  </div>
                </div>
                <div
                  className="absolute top-4 left-4 px-4 py-2 rounded-full text-white text-sm backdrop-blur-sm"
                  style={{ backgroundColor: `${episode.color}CC`, fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}
                >
                  {episode.category}
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-4" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: '#1a1a1a' }}>
                  {episode.title}
                </h3>
                <div className="flex items-center gap-4 text-[#717182]">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                      {episode.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                      {episode.date}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="md:hidden mx-auto mt-8 block text-[#0066FF] hover:text-[#FF8A00] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
          Voir tous les épisodes →
        </button>
      </div>
    </section>
  );
}

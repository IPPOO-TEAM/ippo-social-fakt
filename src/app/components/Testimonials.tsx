import { ImageWithFallback } from './figma/ImageWithFallback';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Aïcha Diallo',
    role: 'Commerçante',
    image: 'https://images.unsplash.com/photo-1573496527892-904f897eb744?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    quote: 'Grâce à IPPOO, j\'ai découvert de nouvelles opportunités pour développer mon commerce. Les témoignages m\'inspirent chaque jour.',
    color: '#FF8A00',
  },
  {
    name: 'Mamadou Traoré',
    role: 'Jeune Entrepreneur',
    image: 'https://images.unsplash.com/photo-1646658056871-97278a8f97ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    quote: 'La plateforme m\'a permis de trouver des formations et de rencontrer d\'autres entrepreneurs. C\'est une ressource inestimable.',
    color: '#00C853',
  },
  {
    name: 'Fatou Koné',
    role: 'Étudiante',
    image: 'https://images.unsplash.com/photo-1563132305-24784f57eeea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    quote: 'Les informations sur les bourses et les stages m\'ont aidée à planifier mon avenir académique. Merci IPPOO !',
    color: '#4A90E2',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-[#F7F7F7] to-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#1a1a1a' }}>
          Témoignages
        </h2>
        <p className="text-center mb-16 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
          Découvrez comment IPPOO transforme des vies au quotidien
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-[24px] p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative"
            >
              <div
                className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center opacity-20"
                style={{ backgroundColor: testimonial.color }}
              >
                <Quote size={24} style={{ color: testimonial.color }} />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-md">
                    <ImageWithFallback
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                    style={{ backgroundColor: testimonial.color }}
                  />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '1.1rem', color: '#1a1a1a' }}>
                    {testimonial.name}
                  </h4>
                  <p className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <p className="text-[#1a1a1a]/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

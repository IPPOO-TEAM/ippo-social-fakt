import { ImageWithFallback } from './figma/ImageWithFallback';
import { CheckCircle2 } from 'lucide-react';

const benefits = [
  'Information accessible et vérifiée',
  'Contenus multilingues et inclusifs',
  'Témoignages authentiques',
  'Accompagnement personnalisé',
  'Communauté active et solidaire',
  'Expertise locale reconnue',
];

export function WhyChooseUs() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center mb-16" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#1a1a1a' }}>
          Pourquoi Nous Choisir ?
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#D4F4E0] flex items-center justify-center">
                    <CheckCircle2 size={24} color="#00C853" strokeWidth={2.5} />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a1a', paddingTop: '0.5rem' }}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="rounded-[28px] overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1573497491207-618cc224f243?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                alt="Femme africaine professionnelle"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

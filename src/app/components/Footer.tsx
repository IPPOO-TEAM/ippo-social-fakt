import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Sparkles, ArrowUpRight } from 'lucide-react';
import logoUrl from '../../imports/social_fakt_fav.jpg';

export function Footer() {
  return (
    <footer className="relative bg-[#0F0A1F] text-white pb-8 overflow-hidden">
      {/* Bande blanche opaque pleine largeur avec le logo centré */}
      <div className="w-full bg-white py-6 flex items-center justify-center px-5">
        <img
          src={logoUrl}
          alt="IPPOO Social Fakts"
          style={{ height: 44, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>

      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#0066FF]/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#FF3FA4]/20 blur-3xl" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative pt-16 md:pt-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0066FF] via-[#FF8A00] to-[#FF3FA4] flex items-center justify-center shadow-lg">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>IPPOO</div>
                <div className="text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em' }}>SOCIAL-FACT</div>
              </div>
            </div>
            <p className="text-white/70 mb-6" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Votre espace d'information et de sensibilisation pour une communauté plus engagée.
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-[#0066FF] hover:border-[#0066FF] flex items-center justify-center transition-all hover:scale-110"
                  aria-label={`Social ${index + 1}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Rubriques
            </h4>
            <ul className="space-y-2.5">
              {['Actualités', 'Podcast', 'Témoignages', 'Secteur Informel', 'Jeunesse', 'Santé'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/65 hover:text-[#FF8A00] transition-colors" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Services
            </h4>
            <ul className="space-y-2.5">
              {['Orientation', 'Formations', 'Événements', 'Support', 'Partenariats'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/65 hover:text-[#FF8A00] transition-colors" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} className="text-[#FF8A00]" />
                </div>
                <span className="text-white/70 mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                  123 Avenue Principale, Ville
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-[#FF8A00]" />
                </div>
                <span className="text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                  +123 456 789 000
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-[#FF8A00]" />
                </div>
                <span className="text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                  contact@ippoo.com
                </span>
              </li>
            </ul>
            <a href="#" className="inline-flex items-center gap-1.5 mt-5 text-[#FF8A00] hover:gap-3 transition-all" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}>
              Nous contacter <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>
            © 2026 IPPOO SOCIAL-FACT. Tous droits réservés.
          </p>
          <div className="flex gap-5">
            <a href="#" className="text-white/50 hover:text-white transition-colors" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>Mentions légales</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[640px] md:min-h-[88vh] flex items-center justify-center overflow-hidden bg-[#0F0A1F]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF] via-[#FF3FA4] to-[#FF8A00]" />
        <div className="absolute -top-32 -left-32 w-[320px] md:w-[500px] h-[320px] md:h-[500px] rounded-full bg-[#FF8A00] opacity-60 blur-[100px] md:blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-[380px] md:w-[600px] h-[380px] md:h-[600px] rounded-full bg-[#FF3FA4] opacity-50 blur-[120px] md:blur-[140px]" style={{ animation: 'pulse 6s ease-in-out infinite' }} />
        <div className="absolute -bottom-32 left-1/4 w-[320px] md:w-[500px] h-[320px] md:h-[500px] rounded-full bg-[#E8B21A] opacity-40 blur-[100px] md:blur-[120px]" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 py-16 md:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center w-full">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-5">
            <Sparkles size={14} className="text-[#E8B21A]" />
            <span className="text-white/95" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }}>
              PLATEFORME COMMUNAUTAIRE #1
            </span>
          </div>

          <h1 className="text-white mb-5" style={{ fontSize: 'clamp(2.25rem, 7vw, 5rem)', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            IPPOO
            <br />
            <span className="bg-gradient-to-r from-[#E8B21A] via-white to-[#E8B21A] bg-clip-text text-transparent">
              Social-Fact
            </span>
          </h1>

          <p className="text-white/90 mb-8 max-w-xl mx-auto lg:mx-0" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            Information, sensibilisation et accompagnement pour une communauté africaine connectée et engagée.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <button className="group bg-white text-[#0066FF] pl-6 pr-2 py-2.5 rounded-full shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.5)] hover:scale-[1.03] active:scale-100 transition-all duration-300 flex items-center justify-between sm:justify-start gap-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
              Découvrir les services
              <span className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                <ArrowRight size={16} />
              </span>
            </button>
            <button className="bg-white/10 backdrop-blur-md border border-white/25 text-white px-6 py-3 rounded-full hover:bg-white/20 active:scale-100 hover:scale-[1.03] transition-all duration-300 flex items-center justify-center gap-2.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.95rem' }}>
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Play size={11} className="text-white fill-white ml-0.5" />
              </span>
              Écouter le podcast
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4 justify-center lg:justify-start">
            <div className="flex -space-x-2.5">
              {[
                'https://images.unsplash.com/photo-1563132337-f159f484226c?w=120&q=80',
                'https://images.unsplash.com/photo-1626639900776-4011102c8712?w=120&q=80',
                'https://images.unsplash.com/photo-1643660398957-614da01c6b14?w=120&q=80',
                'https://images.unsplash.com/photo-1763739528420-bdc297ff4ec7?w=120&q=80',
              ].map((src, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow">
                  <ImageWithFallback src={src} alt="Member" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-white">
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem' }}>+50 000</div>
              <div className="text-white/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>auditeurs actifs</div>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative">
            <div className="absolute -top-5 -left-6 z-20 bg-white/95 backdrop-blur rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C853] to-[#00a843] flex items-center justify-center">
                <Play size={14} className="text-white fill-white ml-0.5" />
              </div>
              <div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>Live Now</div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>2 400 écoutent</div>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-5 z-20 bg-white/95 backdrop-blur rounded-2xl p-3.5 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em' }}>NOUVEAU</span>
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>Épisode #42</div>
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>Entrepreneuriat féminin</div>
            </div>

            <div className="relative rounded-[32px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] border-4 border-white/20 aspect-[4/5]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1747214300285-a8c5f3ab0c0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900"
                alt="Femmes africaines inspirantes"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A1F]/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 80" className="w-full h-auto block" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

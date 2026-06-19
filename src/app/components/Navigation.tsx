import { Menu, X, Search, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const menuItems = ['Accueil', 'Actualités', 'Podcast', 'Témoignages', 'Services', 'Contact'];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_8px_32px_rgba(255,68,54,0.08)]'
          : 'bg-white/40 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066FF] via-[#FF8A00] to-[#FF3FA4] flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(255,68,54,0.5)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Sparkles size={20} className="text-white" strokeWidth={2.5} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00C853] ring-2 ring-white animate-pulse" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                IPPOO
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#0066FF]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                Social-Fact
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-white/60 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/60 shadow-sm">
            {menuItems.map((item, i) => (
              <a
                key={item}
                href="#"
                className={`px-4 py-2 rounded-full transition-all duration-300 hover:bg-white hover:shadow-md ${
                  i === 0 ? 'bg-white shadow-sm text-[#0066FF]' : 'text-[#1a1a1a] hover:text-[#0066FF]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', fontWeight: 500 }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              className="w-11 h-11 rounded-2xl bg-white/70 backdrop-blur border border-white/60 hover:bg-white hover:scale-105 hover:shadow-lg flex items-center justify-center transition-all duration-300"
              aria-label="Search"
            >
              <Search size={18} color="#FF8A00" strokeWidth={2.5} />
            </button>
            <button
              className="relative bg-gradient-to-r from-[#0066FF] to-[#FF3FA4] text-white px-6 py-3 rounded-2xl shadow-[0_8px_24px_-6px_rgba(255,68,54,0.6)] hover:shadow-[0_12px_28px_-4px_rgba(255,68,54,0.7)] hover:scale-105 transition-all duration-300 overflow-hidden group"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}
            >
              <span className="relative z-10">Mon Compte</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF3FA4] to-[#0066FF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          <button
            className="lg:hidden w-11 h-11 rounded-2xl bg-white/70 backdrop-blur border border-white/60 flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} color="#0066FF" /> : <Menu size={22} color="#0066FF" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden mt-4 pb-2 pt-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 px-4 shadow-xl">
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[#1a1a1a] hover:text-[#0066FF] hover:bg-white rounded-xl px-4 py-3 transition-all"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.05rem', fontWeight: 500 }}
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button className="bg-gradient-to-r from-[#0066FF] to-[#FF3FA4] text-white px-6 py-3.5 rounded-2xl mt-3 shadow-lg" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                Mon Compte
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

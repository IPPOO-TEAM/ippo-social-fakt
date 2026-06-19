import { Headphones, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50">
      {expanded && (
        <div className="absolute bottom-full right-0 mb-3 bg-white rounded-2xl shadow-2xl p-4 w-64 border border-[#F0F0F0]">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: '#0066FF', letterSpacing: '0.1em' }}>EN DIRECT</span>
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>Épisode #42</div>
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>Entrepreneuriat féminin</div>
            </div>
            <button onClick={() => setExpanded(false)} className="text-[#717182] hover:text-[#1a1a1a]" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <button className="w-full bg-gradient-to-r from-[#0066FF] to-[#FF8A00] text-white py-2.5 rounded-xl mt-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
            Écouter maintenant
          </button>
        </div>
      )}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="relative bg-gradient-to-br from-[#0066FF] to-[#FF8A00] text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-[0_12px_32px_-8px_rgba(255,68,54,0.6)] hover:scale-110 active:scale-100 transition-all duration-300 flex items-center justify-center"
        aria-label="Écouter maintenant"
      >
        <span className="absolute inset-0 rounded-full bg-[#0066FF] animate-ping opacity-30" />
        <Headphones size={24} strokeWidth={2.5} className="relative" />
      </button>
    </div>
  );
}

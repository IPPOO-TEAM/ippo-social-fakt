import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconBg: string;
}

export function ServiceCard({ icon: Icon, title, description, color, iconBg }: ServiceCardProps) {
  return (
    <div
      className="group relative bg-white rounded-[28px] p-7 cursor-pointer transition-all duration-500 hover:-translate-y-3 overflow-hidden"
      style={{
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {/* Hover gradient glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`,
        }}
      />

      {/* Decorative corner accent */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700"
        style={{ background: color }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500"
            style={{
              backgroundColor: iconBg,
              boxShadow: `0 8px 20px -8px ${color}60`,
            }}
          >
            <Icon size={30} style={{ color }} strokeWidth={2.5} />
          </div>

          <div
            className="w-10 h-10 rounded-full bg-[#F7F7F7] group-hover:bg-white flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ boxShadow: `0 0 0 0 ${color}` }}
          >
            <ArrowUpRight
              size={18}
              className="text-[#717182] group-hover:rotate-45 transition-all duration-300"
              style={{ color: undefined }}
            />
          </div>
        </div>

        <h3 className="mb-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        <p className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', lineHeight: 1.65 }}>
          {description}
        </p>

        {/* Bottom accent line */}
        <div className="mt-6 pt-5 border-t border-[#F0F0F0] flex items-center justify-between">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600, color, letterSpacing: '0.05em' }}>
            EN SAVOIR PLUS
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: color,
                  opacity: 0.3 + i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

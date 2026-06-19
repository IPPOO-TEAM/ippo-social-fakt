import { Smartphone, Phone, MessageSquare, Mic } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  footer?: { left: string; right: string };
  titleSize?: '1rem' | '1.05rem';
  labelSize?: '0.68rem' | '0.7rem';
}

export function LiveAntenneCTA({ title, description, footer, titleSize = '1.05rem', labelSize = '0.7rem' }: Props) {
  return (
    <section className="px-5 mt-6">
      <div className="p-4 bg-[#1a1a1a] text-white" style={{ borderRadius: 14 }}>
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={14} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em' }}>
            RÉAGIR À L&apos;ANTENNE
          </span>
        </div>
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: titleSize, letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {description && (
          <p className="mt-1 opacity-80" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', lineHeight: 1.45 }}>
            {description}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <a href="tel:+229 2722000000" className="flex flex-col items-center gap-1 py-2.5 bg-white/10" style={{ borderRadius: 10 }}>
            <Phone size={16} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: labelSize, fontWeight: 700 }}>Appeler</span>
          </a>
          <a href="sms:+229 0707000000" className="flex flex-col items-center gap-1 py-2.5 bg-white/10" style={{ borderRadius: 10 }}>
            <MessageSquare size={16} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: labelSize, fontWeight: 700 }}>SMS</span>
          </a>
          <button className="flex flex-col items-center gap-1 py-2.5 bg-white/10" style={{ borderRadius: 10 }}>
            <Mic size={16} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: labelSize, fontWeight: 700 }}>Vocal</span>
          </button>
        </div>
        {footer && (
          <div className="text-white/60 mt-2.5 flex items-center justify-between" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
            <span>{footer.left}</span>
            <span>{footer.right}</span>
          </div>
        )}
      </div>
    </section>
  );
}

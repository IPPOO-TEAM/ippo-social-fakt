import { Sparkles, HeartPulse, CircleDollarSign, LineChart, Compass, ScrollText, ChevronRight, CalendarDays, ArrowUpRight, TrendingDown, TrendingUp, Minus, ShieldCheck, Heart } from 'lucide-react';
import { formatFcfa, priceTrendPct, type Opportunity, type PriceItem } from '../../data/mock';
import type { SectionKey } from '../../data/sections';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';
import { useLiveContent } from '../../lib/live-content';

interface Props {
 onOpenSection?: (k: SectionKey) => void;
 onOpenOpportunity?: (o: Opportunity) => void;
 onOpenAssurances?: () => void;
 onOpenBienEtre?: () => void;
}

function trendIcon(t: number) {
 if (t < -0.05) return <TrendingDown size={12} strokeWidth={2.5} />;
 if (t > 0.05) return <TrendingUp size={12} strokeWidth={2.5} />;
 return <Minus size={12} strokeWidth={2.5} />;
}

export function ServicesView({ onOpenSection, onOpenOpportunity, onOpenAssurances, onOpenBienEtre }: Props = {}) {
 const t = useT();
 const tc = useContentT();
 const { items: opportunities } = useLiveContent<Opportunity>('opportunity');
 const { items: prices } = useLiveContent<PriceItem>('price');
 const services: { id: string; name: string; desc: string; icon: typeof Sparkles; color: string; section: SectionKey }[] = [
   { id: 's1', name: t('services.opportunities'), desc: t('services.opp_desc'), icon: Sparkles, color: '#0066FF', section: 'opportunities' },
   { id: 's2', name: t('services.health'), desc: t('services.health_desc'), icon: HeartPulse, color: '#00C853', section: 'sante' },
   { id: 's3', name: t('services.finance'), desc: t('services.finance_desc'), icon: CircleDollarSign, color: '#FF8A00', section: 'informel' },
   { id: 's4', name: t('services.prices'), desc: t('services.prices_desc'), icon: LineChart, color: '#FF3FA4', section: 'consommation' },
   { id: 's5', name: t('services.directory'), desc: t('services.directory_desc'), icon: Compass, color: '#4A90E2', section: 'communaute' },
   { id: 's6', name: t('services.guides'), desc: t('services.guides_desc'), icon: ScrollText, color: '#9B51E0', section: 'services' },
 ];
 const featured = opportunities[0];
 const restOpps = opportunities.slice(1, 5);

 return (
 <div className="pb-8">
 {/* Header */}
 <div className="relative text-white px-5 pt-5 pb-8 overflow-hidden flex flex-col" style={{ minHeight: 240, borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)' }}>
 <ImageWithFallback
 src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1600&q=80"
 alt=""
 className="absolute inset-0 w-full h-full object-cover"
 />
 <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,15,18,0.92) 0%, rgba(44,15,31,0.85) 55%, rgba(15,31,22,0.85) 100%)' }}/>
 <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#FF3FA4]/40 blur-3xl pointer-events-none"/>
 <div className="absolute -bottom-16 -left-10 w-52 h-52 bg-[#00C853]/30 blur-3xl pointer-events-none"/>
 <div className="flex-1"/>
 <p className="relative" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', opacity: 0.9 }}>
 {t('services.eyebrow')}
 </p>
 <h1 className="relative mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.9rem', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
 {t('services.headline')}
 </h1>
 <p className="relative mt-2 max-w-sm opacity-90" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.5 }}>
 {t('services.subhead')}
 </p>
 </div>

 {/* Service tiles — premium glassy cards with ringed icons */}
 <div className="px-5 mt-7 grid grid-cols-2 gap-2.5">
 {services.map((s) => {
 const Icon = s.icon;
 return (
 <button
 key={s.id}
 onClick={() => onOpenSection?.(s.section)}
 className="group relative overflow-hidden bg-white p-4 text-left transition-all hover:-translate-y-0.5"
 style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.10)' }}
 >
 <div
 aria-hidden
 className="absolute -top-10 -right-10 w-28 h-28 opacity-0 group-hover:opacity-60 transition-opacity blur-2xl"
 style={{ background: s.color }}
 />
 <div
 className="relative w-11 h-11 flex items-center justify-center"
 style={{
 borderRadius: 'var(--r-md)',
 background: `linear-gradient(135deg, ${s.color}1F 0%, ${s.color}0A 100%)`,
 boxShadow: `inset 0 0 0 1px ${s.color}26`,
 }}
 >
 <Icon size={20} strokeWidth={2.2} style={{ color: s.color }} />
 </div>
 <div className="relative flex items-end justify-between mt-3.5">
 <div className="flex-1 min-w-0 pr-2">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
 {s.name}
 </div>
 <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', lineHeight: 1.4 }}>
 {s.desc}
 </div>
 </div>
 <ArrowUpRight size={16} className="text-[#C7C7CF] group-hover:text-[#0066FF] transition-colors flex-shrink-0" strokeWidth={2.4} />
 </div>
 </button>
 );
 })}
 </div>

 {/* Micro-assurances banner */}
 <section className="px-5 mt-7">
 <button
 onClick={() => onOpenAssurances?.()}
 className="relative w-full overflow-hidden text-left p-5 flex items-center gap-4"
 style={{
 borderRadius: 'var(--r-lg)',
 background: 'linear-gradient(135deg, #0066FF 0%, #4A90E2 60%, #00C853 100%)',
 boxShadow: '0 10px 30px -18px rgba(0,102,255,0.55)',
 }}
 >
 <div aria-hidden className="absolute -top-12 -right-10 w-36 h-36 bg-white/15 blur-3xl pointer-events-none"/>
 <div className="w-12 h-12 bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0" style={{ borderRadius: 12 }}>
 <ShieldCheck size={22} className="text-white" strokeWidth={2.4} />
 </div>
 <div className="flex-1 min-w-0 text-white">
 <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', opacity: 0.9 }}>
 NOUVEAU · IPPOO ASSURANCES
 </div>
 <div className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
 12 micro-assurances dès 600 F / mois
 </div>
 <div className="mt-0.5 opacity-90" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
 Santé, retraite, marchandises, transport…
 </div>
 </div>
 <ChevronRight size={20} className="text-white flex-shrink-0" />
 </button>
 </section>

 {/* Espace Bien-Être banner */}
 <section className="px-5 mt-3">
 <button
 onClick={() => onOpenBienEtre?.()}
 className="relative w-full overflow-hidden text-left p-5 flex items-center gap-4"
 style={{
 borderRadius: 'var(--r-lg)',
 background: 'linear-gradient(135deg, #9B51E0 0%, #FF3FA4 55%, #FF8A00 100%)',
 boxShadow: '0 10px 30px -18px rgba(155,81,224,0.55)',
 }}
 >
 <div aria-hidden className="absolute -bottom-12 -left-10 w-36 h-36 bg-white/15 blur-3xl pointer-events-none"/>
 <div className="w-12 h-12 bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0" style={{ borderRadius: 12 }}>
 <Heart size={22} className="text-white" strokeWidth={2.4} />
 </div>
 <div className="flex-1 min-w-0 text-white">
 <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', opacity: 0.9 }}>
 ESPACE BIEN-ÊTRE · MUR D'ÉCOUTE
 </div>
 <div className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
 Déposer, écouter, s'apaiser
 </div>
 <div className="mt-0.5 opacity-90" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
 Mood-meter avant/après · musiques thérapeutiques
 </div>
 </div>
 <ChevronRight size={20} className="text-white flex-shrink-0" />
 </button>
 </section>

 {/* Featured opportunity */}
 {featured && (
 <section className="px-5 mt-9">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="w-1 h-4 bg-[#0066FF]" style={{ borderRadius: 999 }}/>
 <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
 {t('services.this_week')}
 </h3>
 </div>
 <button onClick={() => onOpenSection?.('opportunities')} className="text-[#0066FF] flex items-center gap-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
 {t('common.all')} <ChevronRight size={14}/>
 </button>
 </div>

 <button
 onClick={() => onOpenOpportunity?.(featured)}
 className="relative w-full overflow-hidden text-left"
 style={{ borderRadius: 'var(--r-xl)' }}
 >
 <div className="relative aspect-[16/9]">
 <ImageWithFallback src={featured.image} alt={featured.title} className="w-full h-full object-cover"/>
 <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${featured.color}E6 100%)` }}/>
 <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: featured.color }}>
 {featured.tag.toUpperCase()}
 </div>
 <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/30 backdrop-blur text-white flex items-center gap-1" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
 <CalendarDays size={12} strokeWidth={2.5} /> {featured.deadline}
 </div>
 <div className="absolute bottom-3 left-4 right-4 text-white">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
 {featured.title}
 </div>
 </div>
 </div>
 </button>

 <div className="mt-3 space-y-2">
 {restOpps.map((o) => (
 <button
 key={o.id}
 onClick={() => onOpenOpportunity?.(o)}
 className="w-full bg-white p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
 style={{ borderRadius: 'var(--r-md)', boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 6px 20px -16px rgba(0,0,0,0.10)' }}
 >
 <div className="w-12 h-12 overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-sm)'}}>
 <ImageWithFallback src={o.image} alt="" className="w-full h-full object-cover"/>
 </div>
 <div className="flex-1 min-w-0">
 <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', color: o.color }}>
 {tc.opportunity(o.id, 'tag', o.tag).toUpperCase()}
 </span>
 <div className="line-clamp-1 mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', letterSpacing: '-0.005em' }}>
 {tc.opportunity(o.id, 'title', o.title)}
 </div>
 <div className="text-[#717182] flex items-center gap-1 mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 <CalendarDays size={11}/> {tc.opportunity(o.id, 'deadline', o.deadline)}
 </div>
 </div>
 <ChevronRight size={16} className="text-[#C7C7CF] flex-shrink-0"/>
 </button>
 ))}
 </div>
 </section>
 )}

 {/* Prix du marché */}
 <section className="px-5 mt-9">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="w-1 h-4 bg-[#FF3FA4]" style={{ borderRadius: 999 }}/>
 <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
 {t('services.market')}
 </h3>
 </div>
 <button onClick={() => onOpenSection?.('consommation')} className="text-[#0066FF] flex items-center gap-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}>
 {t('services.details')} <ChevronRight size={14}/>
 </button>
 </div>

 <div className="bg-white overflow-hidden" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -18px rgba(0,0,0,0.10)' }}>
 {prices.slice(0, 8).map((p, i) => {
 const trend = priceTrendPct(p);
 const down = trend < -0.05;
 const flat = Math.abs(trend) <= 0.05;
 const tone = flat ? '#717182' : down ? '#00C853' : '#0066FF';
 const toneBg = flat ? '#F2F2F5' : down ? '#E5F8EC' : '#E5EFFF';
 return (
 <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-[#F4F4F6]' : ''}`}>
 <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>{p.product}</div>
 <div className="flex items-center gap-2.5">
 <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>{formatFcfa(p.price)}</span>
 <span
 className="inline-flex items-center gap-1 px-2 py-1"
 style={{ background: toneBg, color: tone, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700 }}
 >
 {trendIcon(trend)}
 {Math.abs(trend).toFixed(1)}%
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </section>
 </div>
 );
}

import { motion } from 'motion/react';
import {
  ChevronLeft, Search, TrendingDown, TrendingUp, Minus, ShoppingBasket, MapPin,
  ArrowUpRight, X, Sparkles, Wheat, Apple, Coffee, Package, Flame,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  formatFcfa, priceTrendPct, inflationSeries, panierMenager,
  type Article, type PriceItem, type PriceCategory,
} from '../../data/mock';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { tap } from '../../lib/haptic';
import { useT } from '../../lib/i18n';
import { useLiveContent } from '../../lib/live-content';

interface Props {
  onBack: () => void;
  onOpenArticle?: (a: Article) => void;
}

type Sort = 'name' | 'price-asc' | 'price-desc' | 'trend-up' | 'trend-down';
type Period = 'instant' | 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year';

const periodMeta: { k: Period; label: string; window: number; suffix: string }[] = [
  { k: 'instant',  label: 'À l\'instant', window: 1,  suffix: 'live' },
  { k: 'day',      label: 'Jour',         window: 1,  suffix: 'sur 1 j' },
  { k: 'week',     label: 'Semaine',      window: 1,  suffix: 'sur 7 j' },
  { k: 'month',    label: 'Mois',         window: 4,  suffix: 'sur 30 j' },
  { k: 'quarter',  label: 'Trimestre',    window: 12, suffix: 'sur 3 mois' },
  { k: 'semester', label: 'Semestre',     window: 12, suffix: 'sur 6 mois' },
  { k: 'year',     label: 'Année',        window: 12, suffix: 'sur 12 mois' },
];

function trendForPeriod(item: PriceItem, period: Period) {
  if (period === 'instant' || period === 'day' || period === 'week') {
    return priceTrendPct(item);
  }
  const meta = periodMeta.find((p) => p.k === period)!;
  const h = item.history;
  if (h.length < 2) return 0;
  const start = h[Math.max(0, h.length - meta.window)];
  const end = item.price;
  return start === 0 ? 0 : ((end - start) / start) * 100;
}

const categoryMeta: Record<PriceCategory, { label: string; icon: typeof Wheat; color: string }> = {
  cereales:  { label: 'Céréales',  icon: Wheat,   color: '#0066FF' },
  frais:     { label: 'Frais',     icon: Apple,   color: '#00C853' },
  boissons:  { label: 'Boissons',  icon: Coffee,  color: '#B57CFF' },
  epicerie:  { label: 'Épicerie',  icon: Package, color: '#FF8A00' },
  energie:   { label: 'Énergie',   icon: Flame,   color: '#FF3FA4' },
};

function trendIcon(t: number, size = 12) {
  if (t < -0.05) return <TrendingDown size={size} strokeWidth={2.5} />;
  if (t > 0.05) return <TrendingUp size={size} strokeWidth={2.5} />;
  return <Minus size={size} strokeWidth={2.5} />;
}

function trendTone(t: number) {
  const flat = Math.abs(t) <= 0.05;
  const down = t < -0.05;
  return {
    fg: flat ? '#717182' : down ? '#00C853' : '#0066FF',
    bg: flat ? '#F2F2F5' : down ? '#E5F8EC' : '#E5EFFF',
  };
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const W = 56, H = 28, P = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (W - P * 2) / Math.max(1, data.length - 1);
  const points = data.map((v, i) => {
    const x = P + i * stepX;
    const y = H - P - ((v - min) / range) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InflationChart() {
  const data = inflationSeries;
  const W = 560, H = 200;
  const padL = 36, padR = 12, padT = 14, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const values = data.map((d) => d.cpi);
  const min = Math.min(100, ...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = innerW / Math.max(1, data.length - 1);

  const xy = (i: number, v: number) => {
    const x = padL + i * stepX;
    const y = padT + innerH - ((v - min) / range) * innerH;
    return { x, y };
  };

  const linePoints = data.map((d, i) => {
    const { x, y } = xy(i, d.cpi);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const areaPath = (() => {
    const first = xy(0, data[0].cpi);
    const last = xy(data.length - 1, data[data.length - 1].cpi);
    const pts = data.map((d, i) => {
      const { x, y } = xy(i, d.cpi);
      return `L${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M${first.x.toFixed(1)},${(padT + innerH).toFixed(1)} L${first.x.toFixed(1)},${first.y.toFixed(1)} ${pts.slice(1).join(' ')} L${last.x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
  })();

  const refY = padT + innerH - ((100 - min) / range) * innerH;

  const yTicks = [min, min + range * 0.5, max].map((v) => ({
    v,
    y: padT + innerH - ((v - min) / range) * innerH,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="cpi-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF3FA4" stopOpacity={0.3}/>
          <stop offset="100%" stopColor="#FF3FA4" stopOpacity={0}/>
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <text key={`y-${t.v.toFixed(2)}`} x={padL - 6} y={t.y + 3} textAnchor="end" fontSize={10} fill="#717182" fontFamily="Inter, sans-serif">
          {t.v.toFixed(0)}
        </text>
      ))}
      <line x1={padL} y1={refY} x2={W - padR} y2={refY} stroke="#717182" strokeDasharray="3 3" strokeWidth={1} />
      <path d={areaPath} fill="url(#cpi-grad)" />
      <polyline points={linePoints.join(' ')} fill="none" stroke="#FF3FA4" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const { x } = xy(i, d.cpi);
        return (
          <text key={`x-${d.month}-${i}`} x={x} y={H - 6} textAnchor="middle" fontSize={10} fill="#717182" fontFamily="Inter, sans-serif">
            {d.month}
          </text>
        );
      })}
    </svg>
  );
}

function PriceDetail({ item, onClose }: { item: PriceItem; onClose: () => void }) {
  const t = useT();
  const pct = priceTrendPct(item);
  const tone = trendTone(pct);
  const cat = categoryMeta[item.category];
  const series = item.history.map((v, i) => ({ s: `S-${item.history.length - i}`, prix: v }));
  const lowest = Math.min(...item.markets.map((m) => m.price));
  const cheapestMarket = item.markets.find((m) => m.price === lowest)?.name;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[65] bg-white max-w-2xl mx-auto overflow-y-auto overscroll-contain"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-black/5 z-10">
        <button onClick={onClose} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label={t('common.close')}>
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em' }}>
            {cat.label.toUpperCase()}
          </div>
          <div className="truncate" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
            {item.product}
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-[#FAFAFA] flex items-center justify-center" aria-label={t('common.close')}>
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-end gap-3">
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '2.4rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {formatFcfa(item.price)}
          </div>
          <div className="text-[#717182] pb-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>/ {item.unit}</div>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1"
            style={{ background: tone.bg, color: tone.fg, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 700 }}
          >
            {trendIcon(pct, 13)} {Math.abs(pct).toFixed(1)}% / 7 d
          </span>
          <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
            sem. précédente : {formatFcfa(item.prev)}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: 'Mini 12 sem.', value: formatFcfa(item.refMin), tone: '#00C853' },
            { label: 'Moyenne', value: formatFcfa(Math.round(item.history.reduce((a, b) => a + b, 0) / item.history.length)) },
            { label: 'Maxi 12 sem.', value: formatFcfa(item.refMax), tone: '#0066FF' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#FAFAFA] p-3" style={{ borderRadius: 'var(--r-md)' }}>
              <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                {kpi.label.toUpperCase()}
              </div>
              <div className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: kpi.tone || '#1a1a1a' }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        <h3 className="mt-7 mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
          Évolution sur 12 semaines
        </h3>
        <div className="bg-white" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cat.color} stopOpacity={0.35}/>
                  <stop offset="100%" stopColor={cat.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="s" tick={{ fontSize: 10, fill: '#717182' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#717182' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: 12 }}
                formatter={(v: number) => [formatFcfa(v), 'Prix']}
              />
              <ReferenceLine y={item.prev} stroke="#717182" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="prix" stroke={cat.color} strokeWidth={2.5} fill={`url(#g-${item.id})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <h3 className="mt-7 mb-2 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
          <MapPin size={15} className="text-[#0066FF]" />
          Comparatif marchés
        </h3>
        <div className="bg-white" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={item.markets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#717182' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#717182' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: 12 }}
                formatter={(v: number) => [formatFcfa(v), 'Prix']}
              />
              <Bar dataKey="price" fill={cat.color} radius={[8, 8, 0, 0]}>
                {item.markets.map((m, i) => (
                  <Cell key={`${item.id}-m-${i}`} fill={m.price === lowest ? '#00C853' : cat.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {cheapestMarket && (
          <div className="mt-3 p-3 flex items-center gap-2 bg-[#E5F8EC]" style={{ borderRadius: 'var(--r-md)' }}>
            <Sparkles size={14} className="text-[#00C853]" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: '#1a1a1a' }}>
              Meilleur prix relevé à <strong>{cheapestMarket}</strong> · {formatFcfa(lowest)} / {item.unit}.
            </span>
          </div>
        )}

        <div className="mt-5 mb-8 text-[#717182] flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
          <span className="w-1.5 h-1.5 bg-[#00C853]" style={{ borderRadius: 999 }}/>
          Source : {item.source} · MAJ {item.updated}
        </div>
      </div>
    </motion.div>
  );
}

export function ConsommationView({ onBack, onOpenArticle }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<PriceCategory | 'all'>('all');
  const [sort, setSort] = useState<Sort>('name');
  const [period, setPeriod] = useState<Period>('week');
  const [open, setOpen] = useState<PriceItem | null>(null);
  const { items: prices } = useLiveContent<PriceItem>('price');
  const { items: articles } = useLiveContent<Article>('article');
  const periodInfo = periodMeta.find((p) => p.k === period)!;
  const tFor = (p: PriceItem) => trendForPeriod(p, period);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = prices.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (!q) return true;
      return p.product.toLowerCase().includes(q);
    });
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case 'price-asc':  return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'trend-up':   return tFor(b) - tFor(a);
        case 'trend-down': return tFor(a) - tFor(b);
        default:           return a.product.localeCompare(b.product, 'fr');
      }
    });
    return arr;
  }, [query, cat, sort, period, prices]);

  // KPIs
  const trends = prices.map(tFor);
  const upCount = trends.filter((x) => x > 0.05).length;
  const downCount = trends.filter((x) => x < -0.05).length;
  const avgTrend = trends.reduce((a, b) => a + b, 0) / trends.length;
  const panierTrend = ((panierMenager.current - panierMenager.prev) / panierMenager.prev) * 100;
  const avgTone = trendTone(avgTrend);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] bg-white max-w-2xl mx-auto flex flex-col overflow-y-auto"
    >
      {/* Hero */}
      <div className="relative text-white px-5 pt-4 pb-16 overflow-hidden flex flex-col" style={{ minHeight: 340, borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)' }}>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,63,164,0.85) 0%, rgba(255,138,0,0.85) 100%)' }}/>
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/15 blur-3xl pointer-events-none"/>
        <div className="relative flex items-center gap-3">
          <button onClick={() => { tap(); onBack(); }} className="w-10 h-10 bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('common.back')}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1"/>
          <div className="w-10 h-10 bg-white/20 backdrop-blur flex items-center justify-center">
            <ShoppingBasket size={18} />
          </div>
        </div>
        <div className="flex-1"/>
        <p className="relative" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', opacity: 0.9 }}>
          {t('conso.eyebrow')}
        </p>
        <h1 className="relative mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {t('conso.headline')}
        </h1>
        <p className="relative opacity-90 mt-2 max-w-md" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', lineHeight: 1.5 }}>
          {t('conso.subhead')}
        </p>
      </div>

      {/* KPI band */}
      <section className="px-5 -mt-4 grid grid-cols-2 gap-2.5 relative z-10">
        <div className="bg-white p-4" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 14px 30px -18px rgba(0,0,0,0.18)' }}>
          <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em' }}>
            {t('conso.kpi.avg')}
          </div>
          <div className="mt-1.5 flex items-end gap-1.5">
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.45rem', color: avgTone.fg, letterSpacing: '-0.02em' }}>
              {avgTrend >= 0 ? '+' : ''}{avgTrend.toFixed(2)}%
            </span>
            <span className="pb-0.5" style={{ color: avgTone.fg }}>{trendIcon(avgTrend, 14)}</span>
          </div>
          <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
            {periodInfo.suffix} · {prices.length} {t('conso.kpi.products')}
          </div>
        </div>
        <div className="bg-white p-4" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 14px 30px -18px rgba(0,0,0,0.18)' }}>
          <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em' }}>
            {t('conso.kpi.basket')}
          </div>
          <div className="mt-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            {formatFcfa(panierMenager.current)}
          </div>
          <div className="mt-1 flex items-center gap-1" style={{ color: trendTone(panierTrend).fg, fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', fontWeight: 700 }}>
            {trendIcon(panierTrend, 12)} {Math.abs(panierTrend).toFixed(1)}% {t('conso.kpi.vs_prev')}
          </div>
        </div>
        <div className="bg-white p-4" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 14px 30px -18px rgba(0,0,0,0.18)' }}>
          <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em' }}>
            {t('conso.kpi.up')}
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.45rem', color: '#0066FF', letterSpacing: '-0.02em' }}>
              {upCount}
            </span>
            <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>/ {prices.length}</span>
          </div>
          <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{t('conso.kpi.products')}</div>
        </div>
        <div className="bg-white p-4" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 14px 30px -18px rgba(0,0,0,0.18)' }}>
          <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em' }}>
            {t('conso.kpi.down')}
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.45rem', color: '#00C853', letterSpacing: '-0.02em' }}>
              {downCount}
            </span>
            <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>/ {prices.length}</span>
          </div>
          <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{t('conso.kpi.products')}</div>
        </div>
      </section>

      {/* Inflation chart */}
      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4" style={{ background: '#FF3FA4', borderRadius: 999 }}/>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              {t('conso.cpi_title')}
            </h3>
          </div>
          <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
            {t('conso.cpi_base')}
          </span>
        </div>
        <div className="bg-white p-3" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.10)' }}>
          <InflationChart />
        </div>
        <div className="mt-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem' }}>
          +{(inflationSeries[inflationSeries.length - 1].cpi - 100).toFixed(1)} pts en 12 mois (≈ 6,7 % d'inflation cumulée).
        </div>
      </section>

      {/* Panier composition */}
      <section className="px-5 mt-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4" style={{ background: '#0066FF', borderRadius: 999 }}/>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            {t('conso.basket_compo')}
          </h3>
        </div>
        <div className="bg-white p-4 flex items-center gap-4" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.10)' }}>
          <div style={{ width: 130, height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={panierMenager.composition} dataKey="value" innerRadius={36} outerRadius={62} paddingAngle={2} stroke="none">
                  {panierMenager.composition.map((c, i) => <Cell key={`pie-${i}`} fill={c.color}/>)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: 12 }}
                  formatter={(v: number, n: string) => [formatFcfa(v), n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            {panierMenager.composition.map((c) => {
              const pct = (c.value / panierMenager.current) * 100;
              return (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: c.color, borderRadius: 999 }}/>
                  <span className="flex-1 truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#1a1a1a' }}>{c.name}</span>
                  <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>{pct.toFixed(0)}%</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#1a1a1a', minWidth: 70, textAlign: 'right' }}>
                    {formatFcfa(c.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-5 mt-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4" style={{ background: '#FF8A00', borderRadius: 999 }}/>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            {t('conso.table_title')}
          </h3>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717182]"/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('conso.search_ph')}
            className="w-full pl-10 pr-10 py-2.5 bg-[#FAFAFA] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#E5E5E5] flex items-center justify-center" aria-label={t('common.clear')}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Période */}
        <div className="mt-3">
          <div className="text-[#717182] mb-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em' }}>
            {t('conso.period')}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {periodMeta.map(({ k }) => {
              const label = t(`conso.period.${k}`);
              const active = period === k;
              return (
                <button
                  key={k}
                  onClick={() => { tap(); setPeriod(k); }}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 transition-all ${
                    active ? 'bg-[#FF3FA4] text-white' : 'bg-[#FAFAFA] text-[#717182]'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
                >
                  {k === 'instant' && <span className={`w-1.5 h-1.5 ${active ? 'bg-white' : 'bg-[#00C853]'} animate-pulse`} style={{ borderRadius: 999 }}/>}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {(['all', 'cereales', 'frais', 'epicerie', 'energie'] as const).map((k) => {
            const active = cat === k;
            const m = k === 'all' ? null : categoryMeta[k];
            const Icon = m?.icon;
            return (
              <button
                key={k}
                onClick={() => { tap(); setCat(k); }}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 transition-all ${
                  active ? 'bg-[#1a1a1a] text-white' : 'bg-[#FAFAFA] text-[#717182]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
              >
                {Icon && <Icon size={13} />}
                {k === 'all' ? t('common.all') : t(`conso.cat.${k}`)}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {([
            { k: 'name', label: t('conso.sort.az') },
            { k: 'price-asc', label: t('conso.sort.price_up') },
            { k: 'price-desc', label: t('conso.sort.price_down') },
            { k: 'trend-up', label: t('conso.sort.up') },
            { k: 'trend-down', label: t('conso.sort.down') },
          ] as const).map(({ k, label }) => {
            const active = sort === k;
            return (
              <button
                key={k}
                onClick={() => { tap(); setSort(k); }}
                className={`flex-shrink-0 px-3 py-1.5 transition-all ${
                  active ? 'bg-[#0066FF] text-white' : 'bg-white text-[#717182] border border-[#F0F0F0]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Table */}
      <section className="px-5 mt-3 mb-8">
        <div className="bg-white overflow-hidden" style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -18px rgba(0,0,0,0.10)' }}>
          <div className="px-4 py-2.5 grid items-center bg-[#FAFAFA] text-[#717182]" style={{ gridTemplateColumns: '1.7fr 0.9fr 0.8fr 0.6fr', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            <div>{t('conso.col.product')}</div>
            <div className="text-right">{t('conso.col.price')}</div>
            <div>{t('conso.col.trend')}</div>
            <div className="text-right">{t(`conso.period.${periodInfo.k}`).toUpperCase()}</div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
              {t('conso.empty')}
            </div>
          ) : filtered.map((p, i) => {
            const pct = tFor(p);
            const tone = trendTone(pct);
            const m = categoryMeta[p.category];
            const Icon = m.icon;
            return (
              <button
                key={p.id}
                onClick={() => { tap(); setOpen(p); }}
                className={`w-full px-4 py-3 grid items-center text-left hover:bg-[#FAFAFA] transition-colors ${i > 0 ? 'border-t border-[#F4F4F6]' : ''}`}
                style={{ gridTemplateColumns: '1.7fr 0.9fr 0.8fr 0.6fr' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}1A`, color: m.color, borderRadius: 'var(--r-sm)' }}>
                    <Icon size={15} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.86rem', fontWeight: 600, color: '#1a1a1a' }}>{p.product}</div>
                    <div className="text-[#717182] truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{t('conso.per_unit')} {p.unit}</div>
                  </div>
                </div>
                <div className="text-right" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.86rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                  {formatFcfa(p.price)}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5" style={{ background: tone.bg, color: tone.fg, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700 }}>
                    {trendIcon(pct, 11)} {Math.abs(pct).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div style={{ width: 56 }}>
                    <Sparkline data={p.history} color={tone.fg} />
                  </div>
                  <ArrowUpRight size={14} className="text-[#C7C7CF] flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-[#717182] flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
          <span className="w-1.5 h-1.5 bg-[#00C853] animate-pulse" style={{ borderRadius: 999 }}/>
          {t('conso.footer')}
        </div>
      </section>

      {/* Articles liés */}
      {(() => {
        const related = articles.filter((a) => ['Consommation', 'Économie locale', 'Économie', 'Secteur informel'].includes(a.category));
        if (related.length === 0 || !onOpenArticle) return null;
        return (
          <section className="px-5 mt-2 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4" style={{ background: '#0066FF', borderRadius: 999 }}/>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                {t('conso.related')}
              </h3>
            </div>
            <div className="space-y-2.5">
              {related.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { tap(); onOpenArticle(a); }}
                  className="w-full bg-white p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5"
                  style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 6px 20px -16px rgba(0,0,0,0.10)' }}
                >
                  <div className="w-16 h-16 overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-md)' }}>
                    <ImageWithFallback src={a.image} alt="" className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', color: a.color }}>
                      {a.category.toUpperCase()}
                    </div>
                    <div className="line-clamp-2 mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', lineHeight: 1.3, letterSpacing: '-0.005em' }}>
                      {a.title}
                    </div>
                    <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                      {a.date} · {a.readTime}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })()}

      {open && <PriceDetail item={open} onClose={() => setOpen(null)} />}
    </motion.div>
  );
}

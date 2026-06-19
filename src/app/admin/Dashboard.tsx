import { useEffect, useMemo, useState } from 'react';
import { FileText, Mic, Video as VideoIcon, Briefcase, FolderOpen, TrendingUp, Eye, Users, Music2, Heart, Database } from 'lucide-react';
import { Link } from 'react-router';
import { useResource } from './store';
import type { Article, Episode, Video, Opportunity, Dossier, MusicTrack } from './store';
import { PageHeader } from './PageHeader';
import { useWellbeing } from '../lib/wellbeing-store';
import { seedContent, type Resource } from '../lib/api';
import * as Mock from '../data/mock';
import { useToast } from '../components/Toast';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function parsePlays(s: string): number {
  const m = s.trim().match(/^([\d.,]+)\s?(k|M)?$/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(',', '.'));
  const unit = (m[2] ?? '').toLowerCase();
  return unit === 'k' ? n * 1e3 : unit === 'm' ? n * 1e6 : n;
}

function formatCompact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}

function Sparkline({ data }: { data: { d: string; v: number }[] }) {
  const max = Math.max(...data.map((p) => p.v));
  const min = Math.min(...data.map((p) => p.v));
  const range = max - min || 1;
  const W = 600;
  const H = 200;
  const PAD = 12;
  const stepX = (W - PAD * 2) / (data.length - 1);
  const points = data.map((p, i) => ({
    x: PAD + i * stepX,
    y: PAD + (1 - (p.v - min) / range) * (H - PAD * 2),
    ...p,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${path} L${points[points.length - 1].x},${H - PAD} L${points[0].x},${H - PAD} Z`;
  return (
    <div className="w-full" style={{ height: 220 }}>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0066FF" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0066FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#spark-fill)" />
        <path d={path} fill="none" stroke="#0066FF" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.d} cx={p.x} cy={p.y} r={3} fill="#0066FF" />
        ))}
        {points.map((p) => (
          <text key={`label-${p.d}`} x={p.x} y={H + 18} fontSize={11} fill="#717182" textAnchor="middle" fontFamily="Inter, sans-serif">
            {p.d}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color, to }: {
  icon: typeof FileText; label: string; value: number | string; hint?: string; color: string; to: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white border border-[#EAEAEE] p-5 hover:border-[#0066FF]/40 transition-colors"
      style={{ borderRadius: 12 }}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 flex items-center justify-center" style={{ background: `${color}1A`, borderRadius: 10 }}>
          <Icon size={18} style={{ color }} strokeWidth={2.4} />
        </div>
      </div>
      <div className="mt-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: '#717182', fontWeight: 500 }}>{label}</div>
      {hint && <div className="mt-1" style={{ fontSize: '0.72rem', color: '#00A03B' }}>{hint}</div>}
    </Link>
  );
}

export function Dashboard() {
  const articles = useResource<Article>('articles').items;
  const episodes = useResource<Episode>('episodes').items;
  const videos = useResource<Video>('videos').items;
  const opps = useResource<Opportunity>('opportunities').items;
  const dossiers = useResource<Dossier>('dossiers').items;
  const tracks = useResource<MusicTrack>('tracks').items;
  const { posts, responses } = useWellbeing();

  const [usersCount, setUsersCount] = useState(0);
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem('ippoo:admin:users');
        setUsersCount(raw ? (JSON.parse(raw) as unknown[]).length : 8);
      } catch { setUsersCount(8); }
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const totalContent = articles.length + episodes.length + videos.length + opps.length + dossiers.length;
  const totalPlays = useMemo(() => episodes.reduce((s, e) => s + parsePlays(e.plays), 0), [episodes]);
  const totalViews = totalContent * 380 + totalPlays * 0.3;

  const trafficData = useMemo(() => {
    const base = Math.max(800, totalViews / 30);
    return DAYS.map((d, i) => ({ d, v: Math.round(base * (0.85 + 0.05 * i + (i === 5 ? 0.15 : 0) + (i === 6 ? 0.08 : 0))) }));
  }, [totalViews]);

  const { show } = useToast();
  const [seeding, setSeeding] = useState(false);
  const runSeed = async () => {
    setSeeding(true);
    const buckets: Array<{ resource: Resource; items: unknown[] }> = [
      { resource: 'article',     items: Mock.articles ?? [] },
      { resource: 'episode',     items: Mock.episodes ?? [] },
      { resource: 'video',       items: Mock.videos ?? [] },
      { resource: 'opportunity', items: Mock.opportunities ?? [] },
      { resource: 'price',       items: Mock.prices ?? [] },
    ];
    let inserted = 0, skipped = 0, failed = 0;
    for (const b of buckets) {
      if (!b.items.length) continue;
      try {
        const r = await seedContent(b.resource, b.items);
        inserted += r.inserted; skipped += r.skipped;
      } catch (e) {
        console.log(`seed ${b.resource} failed`, e);
        failed++;
      }
    }
    setSeeding(false);
    show(`Seed: ${inserted} ajoutés, ${skipped} déjà présents${failed ? `, ${failed} bucket(s) en erreur` : ''}`, failed ? 'error' : 'success');
  };

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme IPPOO" />

      <div className="p-8 space-y-6">
        <div className="bg-white border border-[#EAEAEE] p-5 flex items-center justify-between gap-4" style={{ borderRadius: 12 }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: '#0066FF1A', borderRadius: 10 }}>
              <Database size={18} style={{ color: '#0066FF' }} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>
                Initialiser la base de données
              </div>
              <div style={{ fontSize: '0.78rem', color: '#717182' }}>
                Importer le contenu de départ vers le serveur. Idempotent: n'écrase pas les éléments déjà publiés.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={runSeed}
            disabled={seeding}
            className="px-4 py-2.5 bg-[#0066FF] text-white disabled:opacity-50 flex-shrink-0"
            style={{ borderRadius: 10, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}
          >
            {seeding ? 'Import…' : 'Seed contenu'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={FileText} label="Articles" value={articles.length} color="#0066FF" to="/admin/articles" />
          <StatCard icon={Mic} label="Podcasts" value={episodes.length} color="#9B51E0" to="/admin/episodes" />
          <StatCard icon={VideoIcon} label="Vidéos" value={videos.length} color="#FF3FA4" to="/admin/videos" />
          <StatCard icon={Briefcase} label="Opportunités" value={opps.length} color="#00C853" to="/admin/opportunities" />
          <StatCard icon={FolderOpen} label="Dossiers" value={dossiers.length} color="#FF8A00" to="/admin/dossiers" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-[#EAEAEE] p-5" style={{ borderRadius: 12 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>
                  Trafic 7 jours
                </div>
                <div style={{ fontSize: '0.78rem', color: '#717182' }}>Visites uniques cumulées</div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E4F7E9] text-[#00A03B]" style={{ borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>
                <TrendingUp size={12} /> +12%
              </div>
            </div>
            <Sparkline data={trafficData} />
          </div>

          <div className="bg-white border border-[#EAEAEE] p-5" style={{ borderRadius: 12 }}>
            <div className="mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>
              Engagement
            </div>
            <div className="space-y-3">
              {[
                { icon: Eye, label: 'Vues estimées (30j)', value: formatCompact(totalViews), color: '#0066FF' },
                { icon: Users, label: 'Utilisateurs', value: String(usersCount), color: '#00C853' },
                { icon: Mic, label: 'Écoutes podcasts', value: formatCompact(totalPlays), color: '#9B51E0' },
                { icon: Music2, label: 'Pistes bien-être', value: String(tracks.length), color: '#FF8A00' },
                { icon: Heart, label: 'Messages bien-être', value: `${posts.length} · ${responses.length} rép.`, color: '#FF3FA4' },
                { icon: VideoIcon, label: 'Vidéos publiées', value: String(videos.length), color: '#0066FF' },
              ].map(({ icon: I, label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${color}1A`, borderRadius: 9 }}>
                    <I size={15} style={{ color }} strokeWidth={2.3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: '0.78rem', color: '#717182' }}>{label}</div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EAEAEE]" style={{ borderRadius: 12 }}>
          <div className="px-5 py-4 border-b border-[#EAEAEE]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>
            Derniers articles publiés
          </div>
          <div className="divide-y divide-[#EAEAEE]">
            {articles.slice(0, 5).map((a) => (
              <Link key={a.id} to={`/admin/articles/${a.id}`} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F7F7FA] transition-colors">
                <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-[#F0F0F4]" style={{ borderRadius: 8 }}>
                  <img src={a.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="line-clamp-1" style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a1a' }}>{a.title}</div>
                  <div style={{ fontSize: '0.74rem', color: '#717182' }}>{a.category} · {a.location} · {a.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

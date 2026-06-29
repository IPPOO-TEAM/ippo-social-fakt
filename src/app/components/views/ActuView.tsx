import { ImageWithFallback } from '../figma/ImageWithFallback';
import { optimizedUnsplash } from '../../lib/images';
import { TrendingUp, Briefcase, Heart, GraduationCap, Users, Globe, ChevronRight } from 'lucide-react';
import { type Article } from '../../data/mock';
import { useLiveContent } from '../../lib/live-content';
import { useRubricsFor } from '../../lib/taxonomy';
import type { SectionKey } from '../../data/sections';
import type { Dossier } from './DossierDetail';
import { dossiersData } from '../../data/dossiers';
import { useState } from 'react';
import { useT } from '../../lib/i18n';
import { useContentT } from '../../data/mock_translations';

export { dossiersData };

const iconMap: Record<string, typeof TrendingUp> = {
  TrendingUp, Briefcase, Heart, GraduationCap, Users, Globe,
};

const rubricToSection: Record<string, SectionKey> = {
  'Économie locale': 'informel',
  'Emploi & Formation': 'opportunities',
  'Santé & Bien-être': 'sante',
  'Éducation & Jeunesse': 'jeunesse',
  'Société & Communauté': 'societe',
  'Culture & Territoires': 'societe',
};

interface Props {
  onOpenArticle: (a: Article) => void;
  onOpenSection?: (k: SectionKey) => void;
  onOpenDossier?: (d: Dossier) => void;
}

export function ActuView({ onOpenArticle, onOpenSection, onOpenDossier }: Props) {
  const [activeTab, setActiveTab] = useState<'fil' | 'rubriques' | 'dossiers'>('fil');
  const t = useT();
  const tc = useContentT();
  const { items: articles } = useLiveContent<Article>('article');
  const featured = articles[0];
  const rest = articles.slice(1);
  // Rubriques dynamiques : reflètent ce que l'admin a configuré en back-office.
  const dynRubrics = useRubricsFor('actu');

  return (
    <div className="pb-6">
      {/* Page header */}
      <div className="px-5 pt-5">
        <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1 className="mt-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          {t('actu.tagline')}
        </h1>
      </div>

      {/* Pill tabs */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md mt-4">
        <div className="flex gap-2 px-5 py-3">
          {(['fil', 'rubriques', 'dossiers'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3.5 py-1.5 transition-all"
                style={{
                  background: active ? '#1a1a1a' : '#F4F4F6',
                  color: active ? 'white' : '#717182',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 500,
                  borderRadius: 999,
                }}
              >
                {tab === 'fil' ? t('actu.tab_feed') : tab === 'rubriques' ? t('actu.tab_rubrics') : t('actu.tab_dossiers')}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'fil' && (
        <>
          {/* Featured — magazine card */}
          {featured && (
          <section className="px-5 pt-1">
            <button onClick={() => onOpenArticle(featured)} className="block w-full text-left relative overflow-hidden aspect-[4/5]" style={{ borderRadius: 'var(--r-lg)' }}>
              <ImageWithFallback src={optimizedUnsplash(featured.image, 1200, 75)} alt={featured.title} className="w-full h-full object-cover object-top" loading="lazy" decoding="async"/>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)' }}/>
              <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
                <span className="inline-block px-2.5 py-1 mb-3" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', borderRadius: 999 }}>
                  {tc.article(featured.id, 'category', featured.category).toUpperCase()} · {featured.location.toUpperCase()}
                </span>
                <h2 className="text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                  {tc.article(featured.id, 'title', featured.title)}
                </h2>
                <div className="text-white/75 mt-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
                  {tc.article(featured.id, 'date', featured.date)} · {tc.article(featured.id, 'readTime', featured.readTime)}
                </div>
              </div>
            </button>
          </section>
          )}

          <div className="px-5 mt-7 flex items-end justify-between">
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              {t('actu.more')}
            </h3>
            <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>
              {rest.length} {t('search.articles').toLowerCase()}
            </span>
          </div>

          {/* Row list */}
          <section className="mt-3 px-5 space-y-3">
            {rest.map((a) => (
              <button key={a.id} onClick={() => onOpenArticle(a)} className="w-full text-left p-2.5 flex gap-3 bg-white hover:bg-[#FAFAFA] transition-colors" style={{ borderRadius: 'var(--r-md)' }}>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: a.color, letterSpacing: '0.1em' }}>
                    {tc.article(a.id, 'category', a.category).toUpperCase()}
                  </div>
                  <div className="line-clamp-3 my-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.98rem', color: '#1a1a1a', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    {tc.article(a.id, 'title', a.title)}
                  </div>
                  <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
                    {tc.article(a.id, 'date', a.date)} · {tc.article(a.id, 'readTime', a.readTime)} · {a.location}
                  </div>
                </div>
                <div className="w-24 h-24 overflow-hidden flex-shrink-0" style={{ borderRadius: 'var(--r-sm)' }}>
                  <ImageWithFallback src={optimizedUnsplash(a.image, 480, 65)} alt={a.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                </div>
              </button>
            ))}
          </section>
        </>
      )}

      {activeTab === 'rubriques' && (
        <div className="px-5 mt-4 grid grid-cols-2 gap-3">
          {dynRubrics.map((name) => {
            const count = articles.filter((a) => a.category === name).length;
            const route = rubricToSection[name] ?? 'actu';
            return (
              <button key={name} onClick={() => onOpenSection?.(route)} className="bg-white border border-[#F0F0F0] p-4 text-left hover:border-[#0066FF]/40 transition-colors">
                <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ background: '#0066FF1A', borderRadius: 'var(--r-xs)' }}>
                  <TrendingUp size={18} style={{ color: '#0066FF' }} strokeWidth={2.4} />
                </div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>
                  {name}
                </div>
                <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>
                  {count} contenu{count > 1 ? 's' : ''}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'dossiers' && (
        <div className="px-5 mt-4 space-y-3">
          {dossiersData.map((d) => (
            <button key={d.id} onClick={() => onOpenDossier?.(d)} className="w-full bg-white border border-[#F0F0F0] overflow-hidden text-left hover:border-[#0066FF]/40 transition-colors">
              <div className="aspect-[16/8] overflow-hidden">
                <ImageWithFallback src={optimizedUnsplash(d.image, 800, 70)} alt={d.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
              </div>
              <div className="p-4 flex items-center gap-3">
                <span className="px-2 py-0.5 text-white" style={{ background: d.color, fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>DOSSIER</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.25 }}>{d.title}</div>
                  <div className="text-[#717182] mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{d.subtitle}</div>
                </div>
                <ChevronRight size={16} className="text-[#717182] flex-shrink-0"/>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

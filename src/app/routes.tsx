import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

import { AppHeader } from './components/AppHeader';
import { BottomNav, ViewKey } from './components/BottomNav';
import { MiniPlayer, PlayingTrack } from './components/MiniPlayer';
import { MoreMenu } from './components/MoreMenu';
import { PullToRefresh } from './components/PullToRefresh';
import { ToastProvider } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { Onboarding } from './components/Onboarding';
import { AuthSheet } from './components/AuthSheet';
import { RouteErrorBoundary, RouteFallback } from './components/ErrorBoundary';

// Core navigation views: kept eager (always visible from bottom nav)
import { HomeView } from './components/views/HomeView';
import { ActuView } from './components/views/ActuView';
import { PodcastView } from './components/views/PodcastView';
import { VideosView } from './components/views/VideosView';

// Lazy-loaded secondary views
const ServicesView = lazy(() => import('./components/views/ServicesView').then((m) => ({ default: m.ServicesView })));
const SearchView = lazy(() => import('./components/views/SearchView').then((m) => ({ default: m.SearchView })));
const ProfileView = lazy(() => import('./components/views/ProfileView').then((m) => ({ default: m.ProfileView })));
const ArticleDetail = lazy(() => import('./components/views/ArticleDetail').then((m) => ({ default: m.ArticleDetail })));
const EpisodeDetail = lazy(() => import('./components/views/EpisodeDetail').then((m) => ({ default: m.EpisodeDetail })));
const VideoDetail = lazy(() => import('./components/views/VideoDetail').then((m) => ({ default: m.VideoDetail })));
const ShortsView = lazy(() => import('./components/views/ShortsView').then((m) => ({ default: m.ShortsView })));
const SavedListView = lazy(() => import('./components/views/SavedListView').then((m) => ({ default: m.SavedListView })));
const SectionView = lazy(() => import('./components/views/SectionView').then((m) => ({ default: m.SectionView })));
const ConsommationView = lazy(() => import('./components/views/ConsommationView').then((m) => ({ default: m.ConsommationView })));
const LiveView = lazy(() => import('./components/views/LiveView').then((m) => ({ default: m.LiveView })));
const CommunauteView = lazy(() => import('./components/views/CommunauteView').then((m) => ({ default: m.CommunauteView })));
const OpportunitiesView = lazy(() => import('./components/views/OpportunitiesView').then((m) => ({ default: m.OpportunitiesView })));
const OpportunityDetail = lazy(() => import('./components/views/OpportunityDetail').then((m) => ({ default: m.OpportunityDetail })));
const DossierDetail = lazy(() => import('./components/views/DossierDetail').then((m) => ({ default: m.DossierDetail })));
const AssurancesView = lazy(() => import('./components/views/AssurancesView').then((m) => ({ default: m.AssurancesView })));
const AssuranceDetail = lazy(() => import('./components/views/AssuranceDetail').then((m) => ({ default: m.AssuranceDetail })));
const BienEtreView = lazy(() => import('./components/views/BienEtreView').then((m) => ({ default: m.BienEtreView })));
const BienEtrePost = lazy(() => import('./components/views/BienEtrePost').then((m) => ({ default: m.BienEtrePost })));
const PricingView = lazy(() => import('./components/views/PricingView').then((m) => ({ default: m.PricingView })));
const CheckoutView = lazy(() => import('./components/views/CheckoutView').then((m) => ({ default: m.CheckoutView })));
const SubscriptionView = lazy(() => import('./components/views/SubscriptionView').then((m) => ({ default: m.SubscriptionView })));
const PageView = lazy(() => import('./components/views/PageView').then((m) => ({ default: m.PageView })));

import { findAssurance } from './data/assurances';
import { dossiersData } from './data/dossiers';
import { useWellbeing } from './lib/wellbeing-store';

// Admin shell + login eager (so /admin/login renders fast), pages lazy
import { AdminLayout } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
const AdminDashboard = lazy(() => import('./admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const AdminArticles = lazy(() => import('./admin/AdminArticles').then((m) => ({ default: m.AdminArticles })));
const AdminEpisodes = lazy(() => import('./admin/AdminEpisodes').then((m) => ({ default: m.AdminEpisodes })));
const AdminVideos = lazy(() => import('./admin/AdminVideos').then((m) => ({ default: m.AdminVideos })));
const AdminShorts = lazy(() => import('./admin/AdminShorts').then((m) => ({ default: m.AdminShorts })));
const AdminOpportunities = lazy(() => import('./admin/AdminOpportunities').then((m) => ({ default: m.AdminOpportunities })));
const AdminDossiers = lazy(() => import('./admin/AdminDossiers').then((m) => ({ default: m.AdminDossiers })));
const AdminPrices = lazy(() => import('./admin/AdminPrices').then((m) => ({ default: m.AdminPrices })));
const AdminBienEtre = lazy(() => import('./admin/AdminBienEtre').then((m) => ({ default: m.AdminBienEtre })));
const AdminUsers = lazy(() => import('./admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminSettings = lazy(() => import('./admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminPrograms = lazy(() => import('./admin/AdminPrograms').then((m) => ({ default: m.AdminPrograms })));
const AdminModeration = lazy(() => import('./admin/AdminModeration').then((m) => ({ default: m.AdminModeration })));
const AdminSectionsPage = lazy(() => import('./admin/AdminSections').then((m) => ({ default: m.AdminSectionsPage })));
const AdminPages = lazy(() => import('./admin/AdminPages').then((m) => ({ default: m.AdminPages })));
const AdminThemes = lazy(() => import('./admin/AdminThemes').then((m) => ({ default: m.AdminThemes })));
const AdminPush = lazy(() => import('./admin/AdminPush').then((m) => ({ default: m.AdminPush })));
const AdminSubscriptions = lazy(() => import('./admin/AdminSubscriptions').then((m) => ({ default: m.AdminSubscriptions })));

// Lazy-prefetch chunks during browser idle time after first paint, so that
// route navigations don't pay a network round-trip — but the initial bundle
// stays small. We split into HIGH (likely next tap from Home) and LOW
// (rarely visited unless the user opts in).
if (typeof window !== 'undefined') {
  const HIGH = [
    () => import('./components/views/SearchView'),
    () => import('./components/views/ProfileView'),
    () => import('./components/views/ArticleDetail'),
    () => import('./components/views/VideoDetail'),
    () => import('./components/views/ShortsView'),
    () => import('./components/views/SectionView'),
    () => import('./components/views/LiveView'),
  ];
  const LOW = [
    () => import('./components/views/ServicesView'),
    () => import('./components/views/EpisodeDetail'),
    () => import('./components/views/SavedListView'),
    () => import('./components/views/ConsommationView'),
    () => import('./components/views/CommunauteView'),
    () => import('./components/views/OpportunitiesView'),
    () => import('./components/views/OpportunityDetail'),
    () => import('./components/views/DossierDetail'),
    () => import('./components/views/AssurancesView'),
    () => import('./components/views/AssuranceDetail'),
    () => import('./components/views/BienEtreView'),
    () => import('./components/views/BienEtrePost'),
    () => import('./components/views/PricingView'),
    () => import('./components/views/CheckoutView'),
    () => import('./components/views/SubscriptionView'),
    () => import('./components/views/PageView'),
  ];
  type IdleFn = (cb: () => void, opts?: { timeout: number }) => void;
  const ric: IdleFn = (window as unknown as { requestIdleCallback?: IdleFn }).requestIdleCallback
    ?? ((cb) => setTimeout(cb, 200));
  // Spread loads across idle frames; data-saver users skip prefetch entirely.
  const dataSaver = (() => {
    try { return localStorage.getItem('ippoo:dataSaver') === '1'; } catch { return false; }
  })();
  if (!dataSaver) {
    ric(() => { for (const load of HIGH) load().catch(() => undefined); }, { timeout: 2500 });
    ric(() => { for (const load of LOW) load().catch(() => undefined); }, { timeout: 8000 });
  }
}

import type { PlanId } from './lib/subscription';

import { useTheme } from './lib/theme';
import { articles, videos, shorts, opportunities, type Article, type Video, type Opportunity } from './data/mock';
import { useLiveItem } from './lib/live-content';
import { useDocumentMeta, installSiteStructuredData } from './lib/document-meta';
import type { Dossier } from './components/views/DossierDetail';
import { sectionMap, SectionKey } from './data/sections';
import { useUser } from './lib/user';
import { useT } from './lib/i18n';
import { installPwaMeta, registerServiceWorker, updateHtmlLang, updateThemeColor } from './lib/pwa';
import { initMonitoring, setUser as setMonitoringUser } from './lib/monitoring';
import { initAnalytics, trackPageview } from './lib/analytics';
import { audioEngine, DEMO_AUDIO_URL, useAudioSelector } from './lib/audio-engine';

// Initialize Sentry as early as possible so module-load errors are reported.
if (typeof window !== 'undefined') { initMonitoring(); initAnalytics(); }

interface PlayerCtx {
  track: PlayingTrack | null;
  playing: boolean;
  setTrack: (t: PlayingTrack | null) => void;
  setPlaying: (p: boolean | ((prev: boolean) => boolean)) => void;
  openAuth: () => void;
}
const PlayerContext = createContext<PlayerCtx | null>(null);
export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer outside provider');
  return ctx;
};

function viewFromPath(pathname: string): ViewKey {
  if (pathname === '/' || pathname.startsWith('/home')) return 'home';
  if (pathname.startsWith('/actu')) return 'actu';
  if (pathname.startsWith('/podcast')) return 'podcast';
  if (pathname.startsWith('/videos')) return 'videos';
  return 'home';
}

function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { isDark } = useTheme();
  const t = useT();

  const [authOpen, setAuthOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [track, setTrackState] = useState<PlayingTrack | null>(null);
  const playing = useAudioSelector((e) => e.playing);

  const setTrack = (t: PlayingTrack | null) => {
    setTrackState(t);
    if (!t) { audioEngine.stop(); return; }
    const url = t.audioUrl ?? (t as { audio?: string }).audio ?? DEMO_AUDIO_URL;
    audioEngine.setSource(url, true);
  };
  const setPlaying = (p: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof p === 'function' ? (p as (prev: boolean) => boolean)(audioEngine.playing) : p;
    if (next) audioEngine.play(); else audioEngine.pause();
  };

  useEffect(() => { installPwaMeta(); installSiteStructuredData(); void registerServiceWorker(); }, []);
  useEffect(() => { trackPageview(); }, [location.pathname]);
  useEffect(() => {
    setMonitoringUser(user.authed ? { id: user.email, email: user.email } : undefined);
  }, [user.authed, user.email]);
  useEffect(() => { updateHtmlLang(user.language ?? 'fr'); }, [user.language]);
  useEffect(() => { updateThemeColor(isDark ? '#000000' : '#ffffff'); }, [isDark]);

  const view = viewFromPath(location.pathname);
  const showAlert = view === 'home';
  const titleMap: Record<ViewKey, string | undefined> = {
    home: undefined,
    actu: t('title.actu'),
    podcast: t('title.podcast'),
    videos: t('title.videos'),
    more: undefined,
  };

  // Meta SEO par vue principale. Fournie uniquement pour les routes de nav
  // de base ; les pages de détail (article, vidéo, etc.) gèrent leur propre
  // meta via leur composant, donc on passe `null` pour ne pas les écraser.
  const coreMetaMap: Partial<Record<ViewKey, { title?: string; description: string; keywords?: string }>> = {
    home: {
      description: 'IPPOO Social-Fact : toute l’actualité du Bénin en temps réel — articles, podcasts, vidéos, radio en direct, opportunités et prix des marchés.',
    },
    actu: {
      title: 'Actualités',
      description: 'Suivez l’actualité béninoise et africaine : politique, économie, société, sport et culture, mise à jour en continu.',
      keywords: 'actualités Bénin, info Bénin, politique Bénin, économie Bénin, news Cotonou, journal béninois',
    },
    podcast: {
      title: 'Podcasts',
      description: 'Écoutez les podcasts béninois d’IPPOO : débats, interviews, récits et émissions audio à la demande.',
      keywords: 'podcasts Bénin, audio Bénin, émissions béninoises, interviews, balado Afrique',
    },
    videos: {
      title: 'Vidéos',
      description: 'Regardez les vidéos et reportages d’IPPOO Social-Fact sur l’actualité et la vie au Bénin.',
      keywords: 'vidéos Bénin, reportages Bénin, télévision béninoise, streaming Bénin',
    },
  };
  const isCoreRoute = location.pathname === '/' || ['actu', 'podcast', 'videos'].some((p) => location.pathname.startsWith(`/${p}`));
  useDocumentMeta(isCoreRoute ? coreMetaMap[view] ?? null : null);

  const handleNavChange = (k: ViewKey) => {
    if (k === 'more') { setMoreOpen(true); return; }
    if (k === 'home') navigate('/');
    else navigate(`/${k}`);
  };

  const pickSection = (k: SectionKey, rubric?: string) => {
    if (!rubric && (k === 'home' || k === 'actu' || k === 'podcast' || k === 'videos')) {
      handleNavChange(k as ViewKey);
      return;
    }
    navigate(`/section/${k}${rubric ? `?rubric=${encodeURIComponent(rubric)}` : ''}`);
  };

  const ctx: PlayerCtx = {
    track,
    playing,
    setTrack,
    setPlaying,
    openAuth: () => setAuthOpen(true),
  };

  return (
    <div
      className={`max-w-2xl mx-auto relative ${isDark ? 'dark' : ''}`}
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        borderLeft: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        minHeight: '100dvh',
      }}
    >
      <OfflineBanner />
      <InstallPrompt />
      {!user.onboarded && <Onboarding />}
      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
      <AppHeader
        title={titleMap[view]}
        showAlert={showAlert}
        onOpenSearch={() => navigate('/search')}
        onOpenProfile={() => navigate('/profile')}
        onOpenMenu={() => setMoreOpen(true)}
      />

      <main
        className="relative"
        style={{ paddingBottom: `calc(${track ? '152px' : '84px'} + env(safe-area-inset-bottom))` }}
      >
        <PlayerContext.Provider value={ctx}>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </PlayerContext.Provider>
      </main>

      {track && (
        <MiniPlayer
          track={track}
          playing={playing}
          onToggle={() => setPlaying((p) => !p)}
          onClose={() => { setTrack(null); setPlaying(false); }}
          onExpand={() => navigate('/now-playing')}
        />
      )}
      <BottomNav current={view} onChange={handleNavChange} hasMiniPlayer={!!track} />

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} onPick={pickSection} />
    </div>
  );
}

function HomeRoute() {
  const navigate = useNavigate();
  const { setTrack, setPlaying } = usePlayer();
  return (
    <PullToRefresh onRefresh={() => new Promise((r) => setTimeout(r, 700))}>
      <HomeView
        onPlay={(tr) => { setTrack(tr); setPlaying(true); }}
        onOpenArticle={(a) => navigate(`/article/${a.id}`)}
        onOpenSection={(k) => navigate(`/section/${k}`)}
        onOpenOpportunity={(o) => navigate(`/opportunity/${o.id}`)}
      />
    </PullToRefresh>
  );
}

function ActuRoute() {
  const navigate = useNavigate();
  return (
    <PullToRefresh onRefresh={() => new Promise((r) => setTimeout(r, 700))}>
      <ActuView
        onOpenArticle={(a) => navigate(`/article/${a.id}`)}
        onOpenSection={(k) => navigate(`/section/${k}`)}
        onOpenDossier={(d) => navigate(`/dossier/${d.id}`)}
      />
    </PullToRefresh>
  );
}

function PodcastRoute() {
  const { setTrack, setPlaying } = usePlayer();
  return <PodcastView onPlay={(tr) => { setTrack(tr); setPlaying(true); }} />;
}

function VideosRoute() {
  const navigate = useNavigate();
  return <VideosView onOpenVideo={(v) => navigate(`/video/${v.id}`)} />;
}

function OverlayShell({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      className="fixed inset-0 z-[55] max-w-2xl mx-auto overflow-y-auto"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        borderLeft: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(60, 60, 67, 0.18)',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 9999, background: 'transparent', color: 'var(--foreground)' }}
          aria-label="Retour"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      </div>
      {children}
    </motion.div>
  );
}

function SearchRoute() {
  const navigate = useNavigate();
  const { setTrack, setPlaying } = usePlayer();
  return (
    <AnimatePresence>
      <OverlayShell title="Recherche" onBack={() => navigate(-1)}>
        <SearchView
          onOpenArticle={(a) => navigate(`/article/${a.id}`)}
          onOpenVideo={(v) => navigate(`/video/${v.id}`)}
          onPlay={(tr) => { setTrack(tr); setPlaying(true); }}
        />
      </OverlayShell>
    </AnimatePresence>
  );
}

function ProfileRoute() {
  const navigate = useNavigate();
  const { openAuth } = usePlayer();
  return (
    <AnimatePresence>
      <OverlayShell title="Profil" onBack={() => navigate(-1)}>
        <ProfileView
          onOpenFavorites={() => navigate('/favorites')}
          onOpenHistory={() => navigate('/history')}
          onOpenAuth={openAuth}
        />
      </OverlayShell>
    </AnimatePresence>
  );
}

function ServicesRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <OverlayShell title="Services" onBack={() => navigate(-1)}>
        <ServicesView
          onOpenSection={(k) => navigate(`/section/${k}`)}
          onOpenOpportunity={(o) => navigate(`/opportunity/${o.id}`)}
          onOpenAssurances={() => navigate('/assurances')}
          onOpenBienEtre={() => navigate('/bien-etre')}
        />
      </OverlayShell>
    </AnimatePresence>
  );
}

function ConsommationRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <ConsommationView onBack={() => navigate(-1)} onOpenArticle={(a) => navigate(`/article/${a.id}`)} />
    </AnimatePresence>
  );
}

function LiveRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <LiveView onBack={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function CommunauteRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <CommunauteView onBack={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function OpportunitiesRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <OpportunitiesView onBack={() => navigate(-1)} onOpenOpportunity={(o) => navigate(`/opportunity/${o.id}`)} />
    </AnimatePresence>
  );
}

function SavedRoute({ kind }: { kind: 'favorites' | 'history' }) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <SavedListView kind={kind} onBack={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function SectionRoute() {
  const navigate = useNavigate();
  const { key } = useParams<{ key: string }>();
  const { setTrack, setPlaying } = usePlayer();
  const search = new URLSearchParams(useLocation().search);
  const rubric = search.get('rubric') ?? undefined;
  const sectionKey = key as SectionKey | undefined;

  if (!sectionKey || !sectionMap[sectionKey]) {
    throw new Response('Section introuvable', { status: 404 });
  }
  if (sectionKey === 'consommation') return <ConsommationRoute />;
  if (sectionKey === 'live') return <LiveRoute />;
  if (sectionKey === 'communaute') return <CommunauteRoute />;
  if (sectionKey === 'opportunities') return <OpportunitiesRoute />;
  if (sectionKey === 'services') return <ServicesRoute />;

  return (
    <AnimatePresence>
      <SectionView
        key={`section-${sectionKey}-${rubric ?? ''}`}
        section={sectionMap[sectionKey]}
        onBack={() => navigate(-1)}
        onOpenArticle={(a) => navigate(`/article/${a.id}`)}
        onOpenVideo={(v) => navigate(`/video/${v.id}`)}
        onPlay={(tr) => { setTrack(tr); setPlaying(true); }}
        onOpenOpportunity={(o) => navigate(`/opportunity/${o.id}`)}
        initialRubric={rubric}
      />
    </AnimatePresence>
  );
}

function ArticleRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { item: article, loading, notFound } = useLiveItem<Article>('article', id, articles);
  useDocumentMeta(article ? {
    title: article.title,
    description: article.excerpt,
    image: article.image,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      image: [article.image],
      datePublished: article.date,
      articleSection: article.category,
      description: article.excerpt,
    },
  } : null);
  if (notFound) throw new Response('Article introuvable', { status: 404 });
  if (!article) { void loading; return <RouteFallback />; }
  return (
    <AnimatePresence>
      <ArticleDetail article={article} onBack={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function VideoRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // Fallback list includes shorts mapped into Video shape, so deep-links to a
  // short id still resolve as a "Short" video while the server resolves.
  const compoundFallback: Video[] = [
    ...videos,
    ...shorts.map((s) => ({ id: s.id, title: s.title, type: 'Short', duration: s.duration, image: s.image, section: s.section })),
  ];
  const { item: video, loading, notFound } = useLiveItem<Video>('video', id, compoundFallback);
  useDocumentMeta(video ? {
    title: video.title,
    description: `${video.type} · ${video.duration}`,
    image: video.image,
    type: 'video.other',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: video.title,
      thumbnailUrl: [video.image],
      description: `${video.type} · ${video.duration}`,
    },
  } : null);
  if (notFound) throw new Response('Vidéo introuvable', { status: 404 });
  if (!video) { void loading; return <RouteFallback />; }
  return (
    <AnimatePresence>
      <VideoDetail video={video} onClose={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function OpportunityRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { item: opp, loading, notFound } = useLiveItem<Opportunity>('opportunity', id, opportunities);
  useDocumentMeta(opp ? {
    title: opp.title,
    description: `${opp.tag} · ${opp.deadline}`,
    image: opp.image,
    type: 'article',
  } : null);
  if (notFound) throw new Response('Opportunité introuvable', { status: 404 });
  if (!opp) { void loading; return <RouteFallback />; }
  return (
    <AnimatePresence>
      <OpportunityDetail opportunity={opp} onClose={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function DossierRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setTrack, setPlaying } = usePlayer();
  const { item: dossier, loading, notFound } = useLiveItem<Dossier>('dossier', id, dossiersData);
  useDocumentMeta(dossier ? {
    title: dossier.title,
    description: dossier.subtitle,
    image: dossier.image,
    type: 'article',
  } : null);
  if (notFound) throw new Response('Dossier introuvable', { status: 404 });
  if (!dossier) { void loading; return <RouteFallback />; }
  return (
    <AnimatePresence>
      <DossierDetail
        dossier={dossier}
        onClose={() => navigate(-1)}
        onOpenArticle={(a) => navigate(`/article/${a.id}`)}
        onOpenVideo={(v) => navigate(`/video/${v.id}`)}
        onPlay={(tr) => { setTrack(tr); setPlaying(true); }}
      />
    </AnimatePresence>
  );
}

function AssurancesRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <AssurancesView onBack={() => navigate(-1)} onOpen={(slug) => navigate(`/assurances/${slug}`)} />
    </AnimatePresence>
  );
}

function AssuranceDetailRoute() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const a = slug ? findAssurance(slug) : undefined;
  if (!a) throw new Response('Assurance introuvable', { status: 404 });
  return (
    <AnimatePresence>
      <AssuranceDetail assurance={a} onBack={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function BienEtreRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <BienEtreView onBack={() => navigate(-1)} onOpenPost={(id) => navigate(`/bien-etre/${id}`)} />
    </AnimatePresence>
  );
}

function BienEtrePostRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { posts } = useWellbeing();
  const post = id ? posts.find((p) => p.id === id) : undefined;
  if (!post) throw new Response('Message introuvable', { status: 404 });
  return (
    <AnimatePresence>
      <BienEtrePost post={post} onBack={() => navigate(-1)} />
    </AnimatePresence>
  );
}

function PremiumRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <PricingView onBack={() => navigate(-1)} onChoose={(planId: PlanId) => navigate(`/checkout/${planId}`)} />
    </AnimatePresence>
  );
}

function CheckoutRoute() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  if (planId !== 'monthly' && planId !== 'yearly') return null;
  return (
    <AnimatePresence>
      <CheckoutView planId={planId as PlanId} onBack={() => navigate(-1)} onDone={() => navigate('/subscription', { replace: true })} />
    </AnimatePresence>
  );
}

function SubscriptionRoute() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <SubscriptionView onBack={() => navigate(-1)} onUpgrade={() => navigate('/premium')} />
    </AnimatePresence>
  );
}

function NowPlayingRoute() {
  const navigate = useNavigate();
  const { track, playing, setPlaying } = usePlayer();
  if (!track) return null;
  return (
    <AnimatePresence>
      <EpisodeDetail
        track={track}
        playing={playing}
        onToggle={() => setPlaying((p) => !p)}
        onClose={() => navigate(-1)}
      />
    </AnimatePresence>
  );
}

function AdminShell() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminLayout />
    </Suspense>
  );
}

function NotFoundRoute() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-sm w-full text-center">
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '3rem', color: 'var(--x-blue, #1D9BF0)', letterSpacing: '-0.04em' }}>404</div>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--foreground)' }}>Page introuvable</h1>
        <p className="mt-1.5" style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem' }}>Le lien que vous suivez n'existe plus ou a été déplacé.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-5 py-2.5 text-white" style={{ background: 'var(--x-blue, #1D9BF0)', borderRadius: 9999, fontWeight: 700, fontSize: '0.88rem' }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/admin/login', Component: AdminLogin, errorElement: <RouteErrorBoundary /> },
  {
    path: '/admin',
    Component: AdminShell,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'articles', Component: AdminArticles },
      { path: 'articles/:id', Component: AdminArticles },
      { path: 'episodes', Component: AdminEpisodes },
      { path: 'videos', Component: AdminVideos },
      { path: 'shorts', Component: AdminShorts },
      { path: 'opportunities', Component: AdminOpportunities },
      { path: 'dossiers', Component: AdminDossiers },
      { path: 'prices', Component: AdminPrices },
      { path: 'bien-etre', Component: AdminBienEtre },
      { path: 'programs', Component: AdminPrograms },
      { path: 'moderation', Component: AdminModeration },
      { path: 'push', Component: AdminPush },
      { path: 'pages', Component: AdminPages },
      { path: 'themes', Component: AdminThemes },
      { path: 'sections', Component: AdminSectionsPage },
      { path: 'users', Component: AdminUsers },
      { path: 'subscriptions', Component: AdminSubscriptions },
      { path: 'settings', Component: AdminSettings },
    ],
  },
  {
    path: '/',
    Component: () => (
      <ToastProvider>
        <Root />
      </ToastProvider>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, Component: HomeRoute },
      { path: 'actu', Component: ActuRoute },
      { path: 'podcast', Component: PodcastRoute },
      { path: 'videos', Component: VideosRoute },
      { path: 'search', Component: SearchRoute },
      { path: 'profile', Component: ProfileRoute },
      { path: 'services', Component: ServicesRoute },
      { path: 'consommation', Component: ConsommationRoute },
      { path: 'live', Component: LiveRoute },
      { path: 'communaute', Component: CommunauteRoute },
      { path: 'opportunities', Component: OpportunitiesRoute },
      { path: 'favorites', Component: () => <SavedRoute kind="favorites" /> },
      { path: 'history', Component: () => <SavedRoute kind="history" /> },
      { path: 'section/:key', Component: SectionRoute },
      { path: 'article/:id', Component: ArticleRoute },
      { path: 'video/:id', Component: VideoRoute },
      { path: 'shorts', Component: ShortsView },
      { path: 'shorts/:id', Component: ShortsView },
      { path: 'opportunity/:id', Component: OpportunityRoute },
      { path: 'dossier/:id', Component: DossierRoute },
      { path: 'assurances', Component: AssurancesRoute },
      { path: 'assurances/:slug', Component: AssuranceDetailRoute },
      { path: 'bien-etre', Component: BienEtreRoute },
      { path: 'bien-etre/:id', Component: BienEtrePostRoute },
      { path: 'premium', Component: PremiumRoute },
      { path: 'checkout/:planId', Component: CheckoutRoute },
      { path: 'subscription', Component: SubscriptionRoute },
      { path: 'now-playing', Component: NowPlayingRoute },
      { path: 'pages/:slug', Component: PageView },
      { path: '*', Component: NotFoundRoute },
    ],
  },
  { path: '*', Component: NotFoundRoute },
]);

import { NavLink, Outlet, Navigate, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Mic, Video as VideoIcon, Briefcase, FolderOpen, Users, Settings, LogOut, Shield, LineChart, Heart, Clock, Radio, Layers, BookOpen, Palette, Bell, CreditCard, Zap, MessageSquare } from 'lucide-react';
import { useAdminAuth } from './auth';
import { AdminToastProvider, useAdminToast, ConfirmDialog } from './AdminToast';

const NAV: { to: string; icon: typeof LayoutDashboard; label: string; end?: boolean; roles?: ('admin' | 'editor')[] }[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/admin/articles', icon: FileText, label: 'Articles' },
  { to: '/admin/episodes', icon: Mic, label: 'Podcasts' },
  { to: '/admin/videos', icon: VideoIcon, label: 'Vidéos' },
  { to: '/admin/shorts', icon: Zap, label: 'Shorts' },
  { to: '/admin/opportunities', icon: Briefcase, label: 'Opportunités' },
  { to: '/admin/dossiers', icon: FolderOpen, label: 'Dossiers' },
  { to: '/admin/prices', icon: LineChart, label: 'Prix & conso' },
  { to: '/admin/bien-etre', icon: Heart, label: 'Bien-Être' },
  { to: '/admin/programs', icon: Radio, label: 'Grille radio' },
  { to: '/admin/moderation', icon: MessageSquare, label: 'Modération' },
  { to: '/admin/push', icon: Bell, label: 'Notifications push' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Abonnements' },
  { to: '/admin/pages', icon: BookOpen, label: 'Pages statiques' },
  { to: '/admin/themes', icon: Palette, label: 'Thèmes Bien-Être', roles: ['admin'] },
  { to: '/admin/sections', icon: Layers, label: 'Sections de l\'app', roles: ['admin'] },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs', roles: ['admin'] },
  { to: '/admin/settings', icon: Settings, label: 'Réglages', roles: ['admin'] },
];

function Inner() {
  const { session, logout, refresh } = useAdminAuth();
  const navigate = useNavigate();
  const { show } = useAdminToast();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => {
      const r = session.expiresAt - Date.now();
      setRemaining(r);
      if (r <= 0) {
        show('Session expirée, veuillez vous reconnecter.', 'info');
        logout();
        navigate('/admin/login');
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [session, logout, navigate, show]);

  if (!session) return <Navigate to="/admin/login" replace />;

  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(session.role));
  const expiringSoon = remaining > 0 && remaining < 15 * 60_000;

  return (
    <div className="min-h-screen flex bg-[#F7F7FA]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <aside className="w-64 bg-white border-r border-[#EAEAEE] flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-[#EAEAEE] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0066FF] flex items-center justify-center text-white" style={{ borderRadius: 8 }}>
            <Shield size={16} strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>IPPOO Admin</div>
            <div style={{ fontSize: '0.7rem', color: '#717182' }}>Console éditoriale</div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 mb-0.5 transition-colors ${
                  isActive ? 'bg-[#0066FF] text-white' : 'text-[#1a1a1a] hover:bg-[#F0F0F4]'
                }`
              }
              style={{ borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}
            >
              <Icon size={16} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {expiringSoon && (
          <div className="mx-3 mb-2 p-2.5 flex items-start gap-2 bg-[#FFF6D9]" style={{ borderRadius: 8, fontSize: '0.75rem', color: '#7C5400' }}>
            <Clock size={14} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div style={{ fontWeight: 600 }}>Session bientôt expirée</div>
              <button onClick={() => { refresh(); show('Session prolongée', 'success'); }} className="mt-1 underline" style={{ fontWeight: 600 }}>
                Prolonger
              </button>
            </div>
          </div>
        )}

        <div className="px-3 py-3 border-t border-[#EAEAEE]">
          <div className="px-2 py-2 mb-2">
            <div className="truncate" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1a' }}>{session.email}</div>
            <div style={{ fontSize: '0.7rem', color: '#717182', textTransform: 'capitalize' }}>{session.role}</div>
          </div>
          <button
            onClick={() => setLogoutConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#FEEAEA] text-[#D32F2F] transition-colors"
            style={{ borderRadius: 8, fontSize: '0.82rem', fontWeight: 500 }}
          >
            <LogOut size={15} strokeWidth={2.2} />
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>

      <ConfirmDialog
        open={logoutConfirm}
        title="Se déconnecter ?"
        message="Vous reviendrez à l'écran de connexion."
        confirmLabel="Se déconnecter"
        onCancel={() => setLogoutConfirm(false)}
        onConfirm={() => { setLogoutConfirm(false); logout(); show('Déconnecté·e', 'info'); navigate('/admin/login'); }}
      />
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminToastProvider>
      <Inner />
    </AdminToastProvider>
  );
}

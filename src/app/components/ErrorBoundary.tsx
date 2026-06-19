import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { captureException } from '../lib/monitoring';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  useEffect(() => {
    // 404s aren't actionable; everything else goes to Sentry.
    if (isRouteErrorResponse(error) && error.status === 404) return;
    captureException(error, { boundary: 'route' });
  }, [error]);
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const title = is404 ? 'Page introuvable' : 'Une erreur est survenue';
  const message = is404
    ? "Cette page n'existe pas ou a été déplacée."
    : "Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir à l'accueil.";

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-white">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#FEEAEA]" style={{ borderRadius: 999 }}>
          <AlertTriangle size={28} className="text-[#D32F2F]" />
        </div>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p className="mt-2 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {message}
        </p>
        {!is404 && import.meta.env?.DEV && error instanceof Error && (
          <pre className="mt-3 p-3 bg-[#FAFAFA] text-left overflow-x-auto" style={{ fontSize: '0.7rem', color: '#717182', borderRadius: 8 }}>
            {error.message}
          </pre>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#0066FF] text-white inline-flex items-center justify-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem', borderRadius: 999 }}
          >
            <Home size={16} /> Retour à l'accueil
          </button>
          {!is404 && (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#F4F4F6] text-[#1a1a1a] inline-flex items-center justify-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem', borderRadius: 999 }}
            >
              <RefreshCw size={15} /> Recharger
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RouteFallback() {
  return (
    <div className="min-h-[60dvh] flex items-center justify-center">
      <div className="flex items-center gap-2 text-[#717182]" style={{ fontSize: '0.85rem' }}>
        <span className="w-4 h-4 border-2 border-[#0066FF] border-t-transparent animate-spin" style={{ borderRadius: 999 }} />
        Chargement…
      </div>
    </div>
  );
}

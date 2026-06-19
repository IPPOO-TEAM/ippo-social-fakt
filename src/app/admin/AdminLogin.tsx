import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from './auth';

export function AdminLogin() {
  const { session, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate('/admin', { replace: true });
  }, [session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Email et mot de passe requis.'); return; }
    setBusy(true);
    setError(null);
    try {
      const r = await login(email, password);
      if (!r.ok) setError(r.error ?? 'Erreur');
      else navigate('/admin', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7FA] px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-[#EAEAEE] p-7" style={{ borderRadius: 14 }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 bg-[#0066FF] flex items-center justify-center text-white" style={{ borderRadius: 9 }}>
            <Shield size={17} strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a', letterSpacing: '-0.01em' }}>IPPOO Admin</div>
            <div style={{ fontSize: '0.75rem', color: '#717182' }}>Connexion à la console</div>
          </div>
        </div>

        <label className="block mb-3">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>Email</div>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F7F7FA] border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
            style={{ borderRadius: 8, fontSize: '0.88rem' }}
            required
          />
        </label>

        <label className="block mb-4">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>Mot de passe</div>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 bg-[#F7F7FA] border border-[#EAEAEE] focus:border-[#0066FF] outline-none"
              style={{ borderRadius: 8, fontSize: '0.88rem' }}
              required
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#717182] hover:text-[#1a1a1a]" aria-label={showPwd ? 'Masquer' : 'Afficher'}>
              {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 p-2.5 mb-4 bg-[#FEEAEA] text-[#D32F2F]" style={{ borderRadius: 8, fontSize: '0.8rem' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 bg-[#0066FF] text-white hover:bg-[#0052CC] transition-colors disabled:opacity-60"
          style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.88rem' }}
        >
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>

        <div className="mt-5 pt-5 border-t border-[#EAEAEE]" style={{ fontSize: '0.72rem', color: '#717182', lineHeight: 1.55 }}>
          Authentification Supabase. Le rôle <code style={{ background: '#F0F0F4', padding: '1px 5px', borderRadius: 4 }}>admin</code> ou <code style={{ background: '#F0F0F4', padding: '1px 5px', borderRadius: 4 }}>editor</code> doit être attribué dans <code style={{ background: '#F0F0F4', padding: '1px 5px', borderRadius: 4 }}>app_metadata.role</code>.
        </div>
      </form>
    </div>
  );
}

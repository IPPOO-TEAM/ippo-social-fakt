import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, ChevronLeft, Phone, Search, Check } from 'lucide-react';
import { useUser, signInWithEmail, signUpWithEmail, signOutEverywhere } from '../lib/user';
import { requestPasswordReset, supabase } from '../lib/api';
import { useToast } from './Toast';
import { useT } from '../lib/i18n';
import { AFRICA, WORLD, ALL_COUNTRIES, type Country } from '../data/countries';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'register' | 'forgot';

export function AuthSheet({ open, onClose }: Props) {
  const { user, update } = useUser();
  const { show } = useToast();
  const t = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [country, setCountry] = useState<Country>(ALL_COUNTRIES.find((c) => c.code === 'CI') ?? AFRICA[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await requestPasswordReset(form.email);
        show(t('auth.toast.reset_sent'), 'success');
        setMode('login');
        return;
      }
      if (mode === 'register') {
        await signUpWithEmail(form.email, form.password, form.name.trim() || undefined);
        if (form.phone) update({ phone: `${country.dial} ${form.phone}` });
        show(t('auth.toast.created'), 'success');
      } else {
        await signInWithEmail(form.email, form.password);
        show(t('auth.toast.signed_in'), 'success');
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      show(msg || 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await signOutEverywhere(); } catch { /* ignore */ }
    show(t('auth.toast.signed_out'), 'info');
    onClose();
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase().auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      // Browser will redirect; on return the Supabase session is restored
      // and useUser picks it up. No need to update local state here.
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      show(msg || 'Erreur Google', 'error');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[80] bg-black/50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[81] bg-white max-w-2xl mx-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
              {mode !== 'login' ? (
                <button onClick={() => setMode('login')} aria-label={t('common.back')} className="w-9 h-9 -ml-2 flex items-center justify-center">
                  <ChevronLeft size={20}/>
                </button>
              ) : <div className="w-9"/>}
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
                {mode === 'login' ? t('auth.login_title') : mode === 'register' ? t('auth.register_title') : t('auth.forgot_title')}
              </h2>
              <button onClick={onClose} aria-label={t('common.close')} className="w-9 h-9 -mr-2 flex items-center justify-center">
                <X size={18}/>
              </button>
            </div>

            {user.authed ? (
              <div className="px-5 py-6 text-center">
                <div className="w-16 h-16 mx-auto overflow-hidden flex items-center justify-center text-white" style={{ background: '#0066FF', borderRadius: 999, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
                  ) : (
                    (user.firstName?.[0] ?? 'U').toUpperCase()
                  )}
                </div>
                <div className="mt-3" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>
                  {user.firstName}
                </div>
                <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>
                  {user.email}
                </div>
                <button onClick={logout} className="mt-6 w-full py-3 bg-[#FAFAFA]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#FF3B30' }}>
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-3">
                {mode !== 'forgot' && (
                  <>
                    <button
                      type="button"
                      onClick={googleSignIn}
                      disabled={loading}
                      className="w-full py-3.5 bg-white border border-[#E5E5EA] flex items-center justify-center gap-3 disabled:opacity-50"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
                        <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
                        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                      </svg>
                      {loading ? '…' : mode === 'register' ? t('common.signup_google') : t('common.continue_google')}
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[#F0F0F0]"/>
                      <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600 }}>{t('auth.or')}</span>
                      <div className="flex-1 h-px bg-[#F0F0F0]"/>
                    </div>
                  </>
                )}
                <form onSubmit={submit} className="space-y-3">
                {mode === 'register' && (
                  <Field icon={UserIcon} placeholder={t('auth.firstname')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required/>
                )}
                {mode === 'register' && (
                  <div className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex items-center gap-1.5 px-3 bg-[#FAFAFA]"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a' }}
                      aria-label={t('auth.choose_country')}
                    >
                      <span style={{ minWidth: 26, padding: '1px 5px', background: '#FFFFFF', border: '1px solid #EAEAEE', fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', borderRadius: 4, textAlign: 'center' }}>{country.code}</span>
                      <span>{country.dial}</span>
                    </button>
                    <div className="flex items-center gap-3 bg-[#FAFAFA] px-3 flex-1">
                      <Phone size={16} className="text-[#717182] flex-shrink-0"/>
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder={t('auth.phone')}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                        className="flex-1 py-3 bg-transparent border-0 outline-none"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                )}
                <Field icon={Mail} type="email" placeholder={t('auth.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} required/>
                {mode !== 'forgot' && (
                  <Field icon={Lock} type="password" placeholder={t('auth.password')} value={form.password} onChange={(v) => setForm({ ...form, password: v })} required minLength={6}/>
                )}

                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[#0066FF] text-right block ml-auto" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>
                    {t('auth.forgot_link')}
                  </button>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#0066FF] text-white disabled:opacity-50"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}
                >
                  {loading ? '…' : mode === 'login' ? t('common.login') : mode === 'register' ? t('common.register') : t('common.continue')}
                </button>

                {mode !== 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="w-full text-center text-[#717182]"
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}
                  >
                    {mode === 'login' ? t('auth.no_account') + ' ' : t('auth.has_account') + ' '}
                    <span className="text-[#0066FF] font-semibold">
                      {mode === 'login' ? t('auth.signup') : t('auth.signin')}
                    </span>
                  </button>
                )}
                </form>
              </div>
            )}

            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white flex flex-col"
                  style={{ borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)' }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F0F0]">
                    <button onClick={() => { setPickerOpen(false); setPickerQuery(''); }} aria-label={t('common.back')} className="w-9 h-9 -ml-2 flex items-center justify-center">
                      <ChevronLeft size={20}/>
                    </button>
                    <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a' }}>
                      {t('auth.choose_country')}
                    </h3>
                  </div>
                  <div className="px-4 py-2 border-b border-[#F0F0F0]">
                    <div className="flex items-center gap-2 bg-[#FAFAFA] px-3">
                      <Search size={15} className="text-[#717182]"/>
                      <input
                        autoFocus
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        placeholder={t('auth.search_country')}
                        className="flex-1 py-2.5 bg-transparent border-0 outline-none"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                    {(() => {
                      const q = pickerQuery.trim().toLowerCase();
                      const match = (c: Country) => !q || c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
                      const af = AFRICA.filter(match);
                      const wd = WORLD.filter(match);
                      const Section = ({ title, list }: { title: string; list: Country[] }) => (
                        list.length === 0 ? null : (
                          <>
                            <div className="px-4 pt-3 pb-1 text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em' }}>
                              {title}
                            </div>
                            {list.map((c) => (
                              <button
                                key={c.code}
                                onClick={() => { setCountry(c); setPickerOpen(false); setPickerQuery(''); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAFA] text-left"
                              >
                                <span style={{ minWidth: 32, padding: '2px 6px', background: '#F4F4F6', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em', borderRadius: 4, textAlign: 'center', color: '#1a1a1a' }}>{c.code}</span>
                                <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', color: '#1a1a1a' }}>{c.name}</span>
                                <span className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>{c.dial}</span>
                                {country.code === c.code && <Check size={16} className="text-[#0066FF]"/>}
                              </button>
                            ))}
                          </>
                        )
                      );
                      if (af.length === 0 && wd.length === 0) {
                        return (
                          <div className="px-4 py-10 text-center text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                            {t('auth.no_country')}
                          </div>
                        );
                      }
                      return (
                        <>
                          <Section title={t('auth.section.africa')} list={af}/>
                          <Section title={t('auth.section.world')} list={wd}/>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ icon: Icon, ...rest }: { icon: typeof Mail } & {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean; minLength?: number;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#FAFAFA] px-3">
      <Icon size={16} className="text-[#717182] flex-shrink-0"/>
      <input
        type={rest.type ?? 'text'}
        placeholder={rest.placeholder}
        value={rest.value}
        onChange={(e) => rest.onChange(e.target.value)}
        required={rest.required}
        minLength={rest.minLength}
        className="flex-1 py-3 bg-transparent border-0 outline-none"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.88rem' }}
      />
    </div>
  );
}

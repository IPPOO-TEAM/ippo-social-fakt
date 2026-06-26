import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Bell, Bookmark, History, Heart, Globe, Wifi, ChevronRight, Settings, LogOut, MapPin, Moon, Sun, Sparkles, Crown, Check, Camera, Pencil, Trash2, ShieldCheck, X, Download, Lock, BellRing, CreditCard, FileText } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useSubscription, planById } from '../../lib/subscription';
import { useFavorites, useHistory } from '../../lib/storage';
import { useTheme, ThemeMode } from '../../lib/theme';
import { useUser } from '../../lib/user';
import { useToast } from '../Toast';
import { useT } from '../../lib/i18n';
import { AvatarCropper } from '../AvatarCropper';
import { type SectionKey } from '../../data/sections';
import { useResolvedSections } from '../../lib/admin-overrides';
import { usePublicPages } from '../../lib/admin-overrides';
import { subscribeToPush, unsubscribeFromPush } from '../../lib/push';
import { changePassword } from '../../lib/api';

// See LangSwitcher.tsx — African languages temporarily off the picker until
// their dictionary entries stop falling back to French.
const LANGUAGES = [
 { code: 'fr', label: 'Français' },
 { code: 'en', label: 'English' },
] as const;

interface Props {
 onOpenFavorites: () => void;
 onOpenHistory: () => void;
 onOpenAuth?: () => void;
}

export function ProfileView({ onOpenFavorites, onOpenHistory, onOpenAuth }: Props) {
 const { user, update } = useUser();
 const { show } = useToast();
 const t = useT();
 const navigate = useNavigate();
 const { isPremium, current: currentSub } = useSubscription();
 const [notif, setNotif] = useState(() => localStorage.getItem('ippoo:notif') !== '0');
 const [dataSaver, setDataSaver] = useState(() => localStorage.getItem('ippoo:dataSaver') === '1');
 const [showLanguage, setShowLanguage] = useState(false);
 const [showSubs, setShowSubs] = useState(false);
 const { mode, setMode, isDark } = useTheme();
 const { items: favs } = useFavorites();
 const { items: hist } = useHistory();
 const language = user.language;
 const zone = user.zone;
 const setLanguage = (l: typeof user.language) => { update({ language: l }); show(`Langue : ${LANGUAGES.find(x => x.code === l)?.label ?? l}`, 'success'); };
 const setZone = (z: string) => { update({ zone: z }); show(`${t('profile.toast.zone')} : ${z}`, 'success'); };
 const toggleNotif = async () => {
   const v = !notif;
   setNotif(v);
   localStorage.setItem('ippoo:notif', v ? '1' : '0');
   if (v) {
     const r = await subscribeToPush();
     if (!r.ok) {
       // Reflect real device state if the subscription failed.
       if (r.reason === 'permission_denied') {
         setNotif(false); localStorage.setItem('ippoo:notif', '0');
         show(t('profile.toast.notif_denied', 'Notifications refusées par le navigateur'), 'error');
         return;
       }
       // For unsupported / no_vapid_key / server_error: keep the local
       // preference on but warn — push will retry on next toggle.
       show(t('profile.toast.notif_partial', 'Préférence enregistrée, push indisponible'), 'info');
       return;
     }
     show(t('profile.toast.notif_on'), 'success');
   } else {
     await unsubscribeFromPush();
     show(t('profile.toast.notif_off'), 'info');
   }
 };
 const toggleDataSaver = () => { const v = !dataSaver; setDataSaver(v); localStorage.setItem('ippoo:dataSaver', v ? '1' : '0'); show(v ? t('profile.toast.data_on') : t('profile.toast.data_off'), 'info'); };

 const fileRef = useRef<HTMLInputElement>(null);
 const [cropSrc, setCropSrc] = useState<string | null>(null);
 const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file) return;
   if (!file.type.startsWith('image/')) { show('Veuillez choisir une image', 'info'); return; }
   if (file.size > 5 * 1024 * 1024) { show('Image trop volumineuse (max 5 Mo)', 'info'); return; }
   const reader = new FileReader();
   reader.onload = () => { setCropSrc(String(reader.result)); };
   reader.readAsDataURL(file);
   e.target.value = '';
 };
 const onCropConfirm = (dataUrl: string) => {
   update({ avatar: dataUrl });
   setCropSrc(null);
   show('Photo de profil mise à jour', 'success');
 };
 const removeAvatar = () => { update({ avatar: undefined }); show('Photo de profil retirée', 'info'); };

 const [editOpen, setEditOpen] = useState(false);
 const [editForm, setEditForm] = useState({ firstName: user.firstName, email: user.email ?? '' });
 const openEdit = () => { setEditForm({ firstName: user.firstName, email: user.email ?? '' }); setEditOpen(true); };
 const saveEdit = (e: React.FormEvent) => {
   e.preventDefault();
   update({ firstName: editForm.firstName.trim(), email: editForm.email.trim() || undefined });
   setEditOpen(false);
   show('Profil mis à jour', 'success');
 };

 const [confirmKind, setConfirmKind] = useState<null | 'logout' | 'cache' | 'delete'>(null);
 const cacheKeys = ['ippoo:favorites', 'ippoo:history', 'ippoo:comments', 'ippoo:reactions', 'ippoo:emoji-reactions'];
 const allKeys = [...cacheKeys, 'ippoo:user', 'ippoo:notif', 'ippoo:dataSaver', 'ippoo:theme', 'ippoo:wellbeing'];
 const doConfirm = () => {
   if (confirmKind === 'logout') {
     update({ authed: false, email: undefined });
     show('Vous êtes déconnecté·e', 'info');
   } else if (confirmKind === 'cache') {
     cacheKeys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
     show('Cache vidé', 'success');
   } else if (confirmKind === 'delete') {
     allKeys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
     show('Données supprimées', 'info');
     setTimeout(() => window.location.reload(), 600);
   }
   setConfirmKind(null);
 };

 const goSettings = () => {
   const el = document.getElementById('preferences');
   if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
 };

 const subCount = user.followedSections.length;

 const exportData = () => {
   try {
     const dump: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
     for (let i = 0; i < localStorage.length; i++) {
       const k = localStorage.key(i);
       if (!k || !k.startsWith('ippoo:')) continue;
       try { dump[k] = JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { dump[k] = localStorage.getItem(k); }
     }
     const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     const d = new Date().toISOString().slice(0, 10);
     a.href = url; a.download = `ippoo-mes-donnees-${d}.json`;
     document.body.appendChild(a); a.click(); document.body.removeChild(a);
     setTimeout(() => URL.revokeObjectURL(url), 1000);
     show('Export téléchargé', 'success');
   } catch {
     show('Échec de l\'export', 'error');
   }
 };

 const [pwdOpen, setPwdOpen] = useState(false);
 const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
 const [pwdError, setPwdError] = useState<string | null>(null);
 const openPwd = () => { setPwdForm({ current: '', next: '', confirm: '' }); setPwdError(null); setPwdOpen(true); };
 const [pwdSaving, setPwdSaving] = useState(false);
 const savePwd = async (e: React.FormEvent) => {
   e.preventDefault();
   if (pwdForm.next.length < 8) { setPwdError('Au moins 8 caractères'); return; }
   if (pwdForm.next !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return; }
   if (pwdForm.current && pwdForm.current === pwdForm.next) { setPwdError('Choisissez un mot de passe différent'); return; }
   setPwdSaving(true);
   setPwdError(null);
   try {
     // Changement RÉEL côté serveur (Supabase Auth via l'Edge Function).
     await changePassword(pwdForm.next);
     setPwdOpen(false);
     setPwdForm({ current: '', next: '', confirm: '' });
     show('Mot de passe mis à jour', 'success');
   } catch (err) {
     setPwdError(err instanceof Error ? err.message : 'Échec de la mise à jour. Reconnectez-vous puis réessayez.');
   } finally {
     setPwdSaving(false);
   }
 };

 const publicPages = usePublicPages();

 const pushTopicsLabel =
   !notif ? 'Désactivées' :
   subCount === 0 ? 'Aucune rubrique suivie' :
   `${subCount} rubrique${subCount > 1 ? 's' : ''} · push activé`;

 const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
 <button onClick={onChange} className={`w-11 h-6 transition-colors ${on ? 'bg-[#0066FF]' : 'bg-[#E5E5E5]'}`}>
 <span className={`block w-5 h-5 bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ borderRadius: 999 }} />
 </button>
 );

 type RowProps = {
 icon: React.ComponentType<{ size?: number; className?: string }>;
 label: React.ReactNode;
 hint?: React.ReactNode;
 action?: React.ReactNode;
 onClick?: () => void;
 };
 const Row = ({ icon: Icon, label, hint, action, onClick }: RowProps) => {
 const inner = (
 <>
 <div className="w-9 h-9 bg-[#FAFAFA] flex items-center justify-center flex-shrink-0">
 <Icon size={17} className="text-[#1a1a1a]"/>
 </div>
 <div className="flex-1 min-w-0">
 <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>{label}</div>
 {hint && <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>{hint}</div>}
 </div>
 {action || <ChevronRight size={16} className="text-[#717182]"/>}
 </>
 );
 if (action) {
 return (
 <div className="w-full flex items-center gap-3 px-4 py-3.5 text-left">{inner}</div>
 );
 }
 return (
 <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAFA] transition-colors text-left">{inner}</button>
 );
 };

 return (
 <>
 {cropSrc && <AvatarCropper src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={onCropConfirm} />}
 <div className="pb-6">
 {/* Profile header */}
 <section className="px-5 pt-5">
 <div className="p-5 text-white relative overflow-hidden" style={{ background: '#1a1a1a', borderRadius: 'var(--r-xl)', boxShadow: '0 18px 40px -18px rgba(0,0,0,0.6)' }}>
 <div className="relative flex items-center gap-4">
 <div className="relative flex-shrink-0">
 <button
   onClick={() => fileRef.current?.click()}
   className="w-16 h-16 overflow-hidden ring-4 ring-white/30 block"
   style={{ borderRadius: 999 }}
   aria-label="Changer la photo de profil"
 >
   {user.avatar ? (
     <img src={user.avatar} alt={t('common.profile')} className="w-full h-full object-cover"/>
   ) : user.firstName ? (
     <span className="w-full h-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0066FF, #FF3FA4)', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>
       {user.firstName.trim().charAt(0).toUpperCase()}
     </span>
   ) : (
     <ImageWithFallback src="https://images.unsplash.com/photo-1573496527892-904f897eb744?w=200&q=80" alt={t('common.profile')} className="w-full h-full object-cover"/>
   )}
 </button>
 <button
   onClick={() => fileRef.current?.click()}
   className="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-[#1a1a1a] flex items-center justify-center shadow-md"
   style={{ borderRadius: 999, border: '2px solid #1a1a1a' }}
   aria-label="Modifier la photo"
 >
   <Camera size={13} />
 </button>
 <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
 </div>
 <div className="flex-1 min-w-0">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
 {user.firstName || 'Invité·e'}
 </div>
 <div className="opacity-90 mt-0.5 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>
 <MapPin size={11} /> {user.zone}{user.email ? ` · ${user.email}` : ''}
 </div>
 <div className="mt-1 flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
 <button onClick={() => fileRef.current?.click()} className="opacity-90 hover:opacity-100 underline-offset-2 hover:underline">
 {user.avatar ? 'Changer la photo' : 'Ajouter une photo'}
 </button>
 {user.avatar && (
 <button onClick={removeAvatar} className="opacity-70 hover:opacity-100">
 Retirer
 </button>
 )}
 <button onClick={openEdit} className="opacity-90 hover:opacity-100 inline-flex items-center gap-1 underline-offset-2 hover:underline">
 <Pencil size={11}/> Modifier le profil
 </button>
 </div>
 </div>
 <button onClick={goSettings} className="w-9 h-9 bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('profile.settings')}>
 <Settings size={16} />
 </button>
 </div>
 <div className="relative grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
 {[
 { v: String(favs.length), l: t('profile.favorites') },
 { v: String(subCount), l: t('profile.subscriptions') },
 { v: String(hist.length), l: t('profile.history') },
 ].map((s) => (
 <div key={s.l} className="text-center">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.15rem' }}>{s.v}</div>
 <div className="opacity-90" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem' }}>{s.l}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Premium upsell / status */}
 <section className="px-5 mt-4">
 {isPremium && currentSub ? (
 <div className="relative overflow-hidden p-4 text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a1648 60%, #FF3FA4 100%)', borderRadius: 'var(--r-lg)' }}>
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
 <Crown size={16} className="fill-white"/>
 </div>
 <div className="flex-1">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
 {planById(currentSub.planId).label} actif
 </div>
 <div className="text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 Expire le {new Date(currentSub.expiresAt).toLocaleDateString('fr-FR')}
 </div>
 </div>
 <span className="px-2 py-0.5 bg-[#00C853]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em', borderRadius: 999 }}>
 ACTIF
 </span>
 </div>
 <button onClick={() => navigate('/subscription')} className="w-full mt-3.5 py-2.5 bg-white/15 text-white flex items-center justify-center gap-2 backdrop-blur" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: 'var(--r-pill)' }}>
 Gérer mon abonnement <ChevronRight size={15}/>
 </button>
 </div>
 ) : (
 <div className="relative overflow-hidden p-4 text-white" style={{ background: '#1a1a1a', borderRadius: 'var(--r-lg)', boxShadow: '0 14px 32px -18px rgba(0,0,0,0.4)' }}>
 <div className="relative flex items-center gap-2.5">
 <div className="w-9 h-9 flex items-center justify-center" style={{ background: '#FF3FA4', borderRadius: 999 }}>
 <Crown size={16} className="fill-white"/>
 </div>
 <div className="flex-1">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
 {t('profile.premium.title')}
 </div>
 <div className="text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 Dès 1 000 FCFA/mois · Mobile Money
 </div>
 </div>
 <span className="px-2 py-0.5 bg-[#FF3FA4]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em', borderRadius: 999 }}>
 NOUVEAU
 </span>
 </div>
 <div className="relative grid grid-cols-2 gap-1.5 mt-3.5">
 {['Sans publicité', 'Podcasts illimités', 'Dossiers complets', 'Hors-ligne'].map((b) => (
 <div key={b} className="flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.74rem' }}>
 <Check size={12} className="text-[#00C853]" strokeWidth={3}/> <span className="text-white/85">{b}</span>
 </div>
 ))}
 </div>
 <button onClick={() => navigate('/premium')} className="relative w-full mt-4 py-2.5 bg-[#FF3FA4] text-white flex items-center justify-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.85rem', borderRadius: 'var(--r-pill)' }}>
 {t('profile.premium.try')} <ChevronRight size={15}/>
 </button>
 </div>
 )}
 </section>

 {/* Mon contenu */}
 <section className="px-5 mt-6">
 <h3 className="mb-2.5 px-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.15em' }}>
 {t('profile.my_content')}
 </h3>
 <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
 <Row icon={Bookmark} label={t('profile.favorites')} hint={`${favs.length}`} onClick={onOpenFavorites} />
 <Row icon={History} label={t('profile.history')} hint={`${hist.length}`} onClick={onOpenHistory} />
 <Row icon={CreditCard} label="Mon abonnement" hint={isPremium && currentSub ? `${planById(currentSub.planId).label} · actif` : 'Plan gratuit'} onClick={() => navigate('/subscription')}/>
 <Row icon={Heart} label={t('profile.subscriptions')} hint={String(subCount)} onClick={() => setShowSubs((v) => !v)}/>
 {showSubs && <SubsList followed={user.followedSections} onToggle={(key) => {
   const set = new Set(user.followedSections);
   if (set.has(key)) set.delete(key); else set.add(key);
   update({ followedSections: Array.from(set) });
 }}/>}
 </div>
 </section>

 {/* Préférences */}
 <section id="preferences" className="px-5 mt-5">
 <h3 className="mb-2.5 px-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.15em' }}>
 {t('profile.preferences')}
 </h3>
 <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
 <div className="px-4 py-3.5 flex items-center gap-3">
 <div className="w-9 h-9 bg-[#FAFAFA] flex items-center justify-center flex-shrink-0">
 {isDark ? <Moon size={17} className="text-[#1a1a1a]"/> : <Sun size={17} className="text-[#1a1a1a]"/>}
 </div>
 <div className="flex-1">
 <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>{t('profile.appearance')}</div>
 <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 Auto = sombre la nuit (20h–7h)
 </div>
 </div>
 </div>
 <div className="px-4 pb-3">
 <div className="flex gap-1 bg-[#FAFAFA] p-1">
 {(['light', 'auto', 'dark'] as ThemeMode[]).map((m) => (
 <button
 key={m}
 onClick={() => setMode(m)}
 className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 transition-all ${
 mode === m ? 'bg-white shadow-sm text-[#0066FF]' : 'text-[#717182]'
 }`}
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600 }}
 >
 {m === 'light' && <Sun size={13} />}
 {m === 'auto' && <Sparkles size={13} />}
 {m === 'dark' && <Moon size={13} />}
 {m === 'light' ? t('profile.theme.light') : m === 'auto' ? t('profile.theme.auto') : t('profile.theme.dark')}
 </button>
 ))}
 </div>
 </div>
 <Row icon={notif && subCount > 0 ? BellRing : Bell} label={t('profile.notifications')} hint={pushTopicsLabel} action={<Toggle on={notif} onChange={toggleNotif} />} />
 <Row icon={Globe} label={t('profile.lang_zone')} hint={`${LANGUAGES.find((x) => x.code === language)?.label ?? language} · ${zone}`} onClick={() => setShowLanguage((v) => !v)}/>
 {showLanguage && (
 <div className="px-4 pb-3 pt-1 bg-[#FAFAFA] space-y-2">
 <div className="text-[#717182]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>LANGUE</div>
 <div className="grid grid-cols-2 gap-1">
 {LANGUAGES.map((l) => (
 <button
 key={l.code}
 onClick={() => setLanguage(l.code)}
 className={`flex items-center gap-1.5 px-2 py-1.5 ${language === l.code ? 'bg-[#0066FF] text-white' : 'bg-white text-[#717182]'}`}
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}
 >
 <span style={{ minWidth: 26, padding: '1px 5px', background: language === l.code ? 'rgba(255,255,255,0.22)' : '#F4F4F6', color: language === l.code ? 'white' : '#1a1a1a', fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', borderRadius: 4, textAlign: 'center' }}>{l.code.toUpperCase()}</span>
 <span className="truncate">{l.label}</span>
 </button>
 ))}
 </div>
 <div className="text-[#717182] mt-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>ZONE</div>
 <div className="grid grid-cols-3 gap-1">
 {['Cotonou', 'Parakou', 'Porto-Novo', 'Sèmè-Kpodji', 'Natitingou', 'Abomey'].map((z) => (
 <button key={z} onClick={() => setZone(z)} className={`py-1.5 ${zone === z ? 'bg-[#0066FF] text-white' : 'bg-white text-[#717182]'}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600 }}>{z}</button>
 ))}
 </div>
 </div>
 )}
 <Row icon={Wifi} label={t('profile.data_saver')} hint="" action={<Toggle on={dataSaver} onChange={toggleDataSaver} />} />
 </div>
 </section>

 {/* Informations légales */}
 {publicPages.length > 0 && (
 <section className="px-5 mt-5">
 <h3 className="mb-2.5 px-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.15em' }}>
 INFORMATIONS
 </h3>
 <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
 {publicPages.map((p) => (
 <Row key={p.id} icon={FileText} label={p.title} hint={`Mise à jour : ${new Date(p.updatedAt).toLocaleDateString('fr-FR')}`} onClick={() => navigate(`/pages/${p.slug}`)} />
 ))}
 </div>
 </section>
 )}

 {/* Confidentialité */}
 <section className="px-5 mt-5">
 <h3 className="mb-2.5 px-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#717182', letterSpacing: '0.15em' }}>
 CONFIDENTIALITÉ
 </h3>
 <div className="bg-white border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
 {user.authed && (
   <Row icon={Lock} label="Mot de passe" hint="Modifier votre mot de passe" onClick={openPwd}/>
 )}
 <Row icon={Download} label="Exporter mes données" hint="Téléchargement JSON" onClick={exportData}/>
 <Row icon={ShieldCheck} label="Vider le cache" hint="Favoris, historique, réactions" onClick={() => setConfirmKind('cache')}/>
 <Row icon={Trash2} label="Supprimer mes données" hint="Réinitialise complètement l'application" onClick={() => setConfirmKind('delete')}/>
 </div>
 </section>

 {user.authed ? (
 <button onClick={() => setConfirmKind('logout')} className="mx-5 mt-6 w-[calc(100%-2.5rem)] py-3.5 bg-[#FAFAFA] text-[#FF3B30] flex items-center justify-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
 <LogOut size={16} /> {t('common.logout')}
 </button>
 ) : (
 <button onClick={onOpenAuth} className="mx-5 mt-6 w-[calc(100%-2.5rem)] py-3.5 bg-[#0066FF] text-white flex items-center justify-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
 {t('common.login')} / {t('common.register')}
 </button>
 )}

 <div className="text-center text-[#717182] mt-5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
 IPPOO Social-Fact · v1.0.0
 </div>
 </div>

 {editOpen && (
 <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setEditOpen(false)}>
 <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white" style={{ borderRadius: '14px 14px 0 0' }}>
 <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>Modifier le profil</div>
 <button onClick={() => setEditOpen(false)} className="w-9 h-9 flex items-center justify-center" aria-label="Fermer"><X size={18}/></button>
 </div>
 <form onSubmit={saveEdit} className="px-4 py-4 space-y-3">
 <label className="block">
 <div className="text-[#717182] mb-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>PRÉNOM</div>
 <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required maxLength={40} className="w-full bg-[#FAFAFA] px-3 py-3 outline-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}/>
 </label>
 <label className="block">
 <div className="text-[#717182] mb-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>EMAIL</div>
 <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-[#FAFAFA] px-3 py-3 outline-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}/>
 </label>
 <div className="flex items-center gap-2 pt-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
 <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-3 bg-[#F4F4F6] text-[#1a1a1a]" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>Annuler</button>
 <button type="submit" className="flex-1 py-3 bg-[#0066FF] text-white" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>Enregistrer</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {pwdOpen && (
 <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setPwdOpen(false)}>
 <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white" style={{ borderRadius: '14px 14px 0 0' }}>
 <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>Modifier le mot de passe</div>
 <button onClick={() => setPwdOpen(false)} className="w-9 h-9 flex items-center justify-center" aria-label="Fermer"><X size={18}/></button>
 </div>
 <form onSubmit={savePwd} className="px-4 py-4 space-y-3">
 <label className="block">
 <div className="text-[#717182] mb-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>MOT DE PASSE ACTUEL</div>
 <input type="password" autoComplete="current-password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} className="w-full bg-[#FAFAFA] px-3 py-3 outline-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}/>
 </label>
 <label className="block">
 <div className="text-[#717182] mb-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>NOUVEAU MOT DE PASSE</div>
 <input type="password" autoComplete="new-password" required minLength={8} value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} className="w-full bg-[#FAFAFA] px-3 py-3 outline-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}/>
 </label>
 <label className="block">
 <div className="text-[#717182] mb-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}>CONFIRMER</div>
 <input type="password" autoComplete="new-password" required minLength={8} value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} className="w-full bg-[#FAFAFA] px-3 py-3 outline-none" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}/>
 </label>
 {pwdError && (
   <div className="text-[#FF3B30]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>{pwdError}</div>
 )}
 <div className="flex items-center gap-2 pt-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
 <button type="button" onClick={() => setPwdOpen(false)} className="flex-1 py-3 bg-[#F4F4F6] text-[#1a1a1a]" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>Annuler</button>
 <button type="submit" disabled={pwdSaving} className="flex-1 py-3 bg-[#0066FF] text-white disabled:opacity-60" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>{pwdSaving ? 'Mise à jour…' : 'Mettre à jour'}</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {confirmKind && (
 <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setConfirmKind(null)}>
 <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white" style={{ borderRadius: '14px 14px 0 0' }}>
 <div className="px-5 pt-5 pb-3">
 <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#1a1a1a' }}>
 {confirmKind === 'logout' ? 'Se déconnecter ?' : confirmKind === 'cache' ? 'Vider le cache ?' : 'Supprimer toutes vos données ?'}
 </div>
 <div className="text-[#717182] mt-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
 {confirmKind === 'logout' ? 'Vous pourrez vous reconnecter à tout moment.' : confirmKind === 'cache' ? 'Vos favoris, historique et réactions seront effacés. Vos préférences restent.' : 'Cette action est irréversible : compte, préférences, historique, tout sera supprimé. Pensez à exporter vos données avant.'}
 </div>
 </div>
 <div className="flex items-center gap-2 px-4 pb-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
 <button onClick={() => setConfirmKind(null)} className="flex-1 py-3 bg-[#F4F4F6] text-[#1a1a1a]" style={{ borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.88rem' }}>Annuler</button>
 <button onClick={doConfirm} className="flex-1 py-3 text-white" style={{ background: confirmKind === 'delete' ? '#FF3B30' : confirmKind === 'logout' ? '#1a1a1a' : '#0066FF', borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
 {confirmKind === 'logout' ? 'Se déconnecter' : confirmKind === 'cache' ? 'Vider' : 'Supprimer'}
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}

const NON_SUBSCRIBABLE: SectionKey[] = ['home', 'search', 'profile'];

function SubsList({ followed, onToggle }: { followed: string[]; onToggle: (key: string) => void }) {
 // Inclut toutes les sections visibles (code + custom), sauf les routes système.
 const list = useResolvedSections().filter((s) => !s.hidden && !NON_SUBSCRIBABLE.includes(s.key as SectionKey));
 return (
 <div className="px-4 pb-3 pt-1 space-y-1.5 bg-[#FAFAFA]">
 {list.map((s) => {
 const on = followed.includes(s.key);
 const Icon = s.icon;
 return (
 <div key={s.key} className="flex items-center justify-between py-1.5 gap-3">
 <div className="flex items-center gap-2 min-w-0">
 <span className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}1A`, color: s.color, borderRadius: 8 }}>
 <Icon size={14}/>
 </span>
 <span className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#1a1a1a' }}>{s.label}</span>
 </div>
 <button
 onClick={() => onToggle(s.key)}
 className={`px-2.5 py-1 flex-shrink-0 transition-colors ${on ? 'bg-[#0066FF] text-white' : 'bg-white text-[#0066FF] border border-[#0066FF]/30'}`}
 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 600, borderRadius: 'var(--r-pill)' }}
 >
 {on ? 'Suivi' : 'Suivre'}
 </button>
 </div>
 );
 })}
 </div>
 );
}

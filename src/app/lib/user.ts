import { useEffect, useState, useCallback } from 'react';
import { safeStorage, STORAGE_KEYS } from './storage-safe';

export interface UserProfile {
  firstName: string;
  email?: string;
  phone?: string;
  zone: string;
  language: 'fr' | 'en' | 'fon' | 'yo' | 'wo' | 'ha' | 'ig' | 'ln' | 'bm' | 'ff' | 'dyu' | 'sef' | 'dje';
  followedSections: string[];
  onboarded: boolean;
  authed: boolean;
  avatar?: string;
}

const KEY = STORAGE_KEYS.user;
const DEFAULT: UserProfile = {
  firstName: '',
  zone: 'Cotonou',
  language: 'fr',
  followedSections: ['actu', 'opportunities', 'consommation'],
  onboarded: false,
  authed: false,
};

function read(): UserProfile {
  return { ...DEFAULT, ...safeStorage.get<Partial<UserProfile>>(KEY, {}) };
}

function write(value: UserProfile) {
  safeStorage.set(KEY, value);
}

export function useUser() {
  const [user, setUser] = useState<UserProfile>(() => read());

  useEffect(() => {
    const h = () => setUser(read());
    const cross = (e: StorageEvent) => { if (e.key === KEY) h(); };
    window.addEventListener(`storage:${KEY}`, h);
    window.addEventListener('storage', cross);
    return () => {
      window.removeEventListener(`storage:${KEY}`, h);
      window.removeEventListener('storage', cross);
    };
  }, []);

  const update = useCallback((patch: Partial<UserProfile>) => {
    const next = { ...read(), ...patch };
    write(next);
    setUser(next);
  }, []);

  const reset = useCallback(() => {
    write(DEFAULT);
    setUser(DEFAULT);
  }, []);

  return { user, update, reset };
}

// ============== SERVER-BACKED AUTH ==============
import { signUp as apiSignUp, signIn as apiSignIn, signOut as apiSignOut, getMe as apiGetMe } from './api';

export async function signUpWithEmail(email: string, password: string, firstName?: string) {
  await apiSignUp(email, password, firstName);
  const me = await apiGetMe().catch(() => null);
  const cur = read();
  const next: UserProfile = {
    ...cur,
    email,
    firstName: firstName ?? cur.firstName,
    authed: true,
    onboarded: true,
    ...(me?.profile && typeof me.profile === 'object' ? (me.profile as Partial<UserProfile>) : {}),
  };
  write(next);
  window.dispatchEvent(new Event(`storage:${KEY}`));
  return next;
}

export async function signInWithEmail(email: string, password: string) {
  await apiSignIn(email, password);
  const me = await apiGetMe().catch(() => null);
  const cur = read();
  const next: UserProfile = {
    ...cur,
    email,
    authed: true,
    onboarded: true,
    ...(me?.profile && typeof me.profile === 'object' ? (me.profile as Partial<UserProfile>) : {}),
  };
  write(next);
  window.dispatchEvent(new Event(`storage:${KEY}`));
  return next;
}

export async function signOutEverywhere() {
  try { await apiSignOut(); } catch (err) { console.log('signOut error:', err); }
  const cur = read();
  const next: UserProfile = { ...cur, authed: false };
  write(next);
  window.dispatchEvent(new Event(`storage:${KEY}`));
}

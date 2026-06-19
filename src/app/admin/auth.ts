import { useEffect, useState, useCallback } from 'react';
import { safeStorage, STORAGE_KEYS } from '../lib/storage-safe';
import { signIn as apiSignIn, signOut as apiSignOut, getMe } from '../lib/api';

const KEY = STORAGE_KEYS.adminAuth;
const ATTEMPT_KEY = STORAGE_KEYS.adminAttempts;
const SESSION_TTL = 12 * 60 * 60 * 1000; // 12h
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 5 * 60 * 1000;

export interface AdminSession {
  email: string;
  role: 'admin' | 'editor';
  loggedAt: number;
  expiresAt: number;
}

interface AttemptState { count: number; lockedUntil: number }

function readAttempts(): AttemptState {
  return safeStorage.get<AttemptState>(ATTEMPT_KEY, { count: 0, lockedUntil: 0 });
}
function writeAttempts(s: AttemptState) { safeStorage.set(ATTEMPT_KEY, s); }

function read(): AdminSession | null {
  const s = safeStorage.get<AdminSession | null>(KEY, null);
  if (!s) return null;
  if (!s.expiresAt || Date.now() > s.expiresAt) {
    safeStorage.remove(KEY);
    return null;
  }
  return s;
}

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(() => read());

  useEffect(() => {
    const local = () => setSession(read());
    const cross = (e: StorageEvent) => { if (e.key === KEY) setSession(read()); };
    window.addEventListener(`storage:${KEY}`, local);
    window.addEventListener('storage', cross);
    const tick = setInterval(() => {
      const s = read();
      setSession((prev) => (prev && !s ? null : prev));
    }, 60_000);
    return () => {
      window.removeEventListener(`storage:${KEY}`, local);
      window.removeEventListener('storage', cross);
      clearInterval(tick);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const att = readAttempts();
    if (att.lockedUntil > Date.now()) {
      const min = Math.max(1, Math.ceil((att.lockedUntil - Date.now()) / 60_000));
      return { ok: false, error: `Trop de tentatives. Réessayez dans ${min} min.` };
    }
    const norm = email.trim().toLowerCase();
    try {
      await apiSignIn(norm, password);
      const { user } = await getMe();
      const role = (user.role === 'admin' || user.role === 'editor') ? user.role : null;
      if (!role) {
        await apiSignOut().catch(() => undefined);
        const next = att.count + 1;
        const locked = next >= MAX_ATTEMPTS;
        writeAttempts({ count: locked ? 0 : next, lockedUntil: locked ? Date.now() + LOCK_DURATION : 0 });
        return { ok: false, error: 'Accès refusé : ce compte n\'a pas de rôle administrateur.' };
      }
      writeAttempts({ count: 0, lockedUntil: 0 });
      const now = Date.now();
      const s: AdminSession = { email: norm, role, loggedAt: now, expiresAt: now + SESSION_TTL };
      safeStorage.set(KEY, s);
      setSession(s);
      return { ok: true };
    } catch (e) {
      const next = att.count + 1;
      const locked = next >= MAX_ATTEMPTS;
      writeAttempts({ count: locked ? 0 : next, lockedUntil: locked ? Date.now() + LOCK_DURATION : 0 });
      const msg = e instanceof Error ? e.message : 'Identifiants invalides.';
      return { ok: false, error: locked ? 'Compte verrouillé 5 minutes après 5 tentatives.' : msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiSignOut().catch(() => undefined);
    safeStorage.remove(KEY);
    setSession(null);
  }, []);

  const refresh = useCallback(() => {
    const cur = read();
    if (!cur) return;
    const next: AdminSession = { ...cur, expiresAt: Date.now() + SESSION_TTL };
    safeStorage.set(KEY, next);
    setSession(next);
  }, []);

  return { session, login, logout, refresh };
}

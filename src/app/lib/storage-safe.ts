// Central registry of localStorage keys + a safe wrapper that handles quota,
// SSR/no-window contexts, broken JSON, and cross-tab/in-tab change events.

export const STORAGE_KEYS = {
  user: 'ippoo:user',
  theme: 'ippoo:theme',
  subscription: 'ippoo:subscription',
  favorites: 'ippoo:favorites',
  history: 'ippoo:history',
  comments: 'ippoo:comments',
  commentsLiked: 'ippoo:comments-liked',
  reactions: 'ippoo:reactions',
  emojiReactions: 'ippoo:emoji-reactions',
  notif: 'ippoo:notif',
  notifications: 'ippoo:notifications',
  dataSaver: 'ippoo:dataSaver',
  recentSearches: 'ippoo:recentSearches',
  pwdChangedAt: 'ippoo:pwd_changed_at',
  wellbeing: 'ippoo:wellbeing',
  wbMoodlog: 'ippoo:wellbeing:moodlog',
  wbPosts: 'ippoo:wellbeing:posts',
  wbResponses: 'ippoo:wellbeing:responses',
  wbHelpful: 'ippoo:wellbeing:helpful',
  adminAuth: 'ippoo:admin:auth',
  adminAttempts: 'ippoo:admin:attempts',
  adminArticles: 'ippoo:admin:articles',
  adminEpisodes: 'ippoo:admin:episodes',
  adminVideos: 'ippoo:admin:videos',
  adminDossiers: 'ippoo:admin:dossiers',
  adminOpportunities: 'ippoo:admin:opportunities',
  adminPages: 'ippoo:admin:pages',
  adminPrices: 'ippoo:admin:prices',
  adminPrograms: 'ippoo:admin:programs',
  adminPushHistory: 'ippoo:admin:push-history',
  adminSections: 'ippoo:admin:sections',
  adminShorts: 'ippoo:admin:shorts',
  adminSettings: 'ippoo:admin:settings',
  adminTracks: 'ippoo:admin:tracks',
  adminUsers: 'ippoo:admin:users',
  adminWbThemes: 'ippoo:admin:wb-themes',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name;
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(err.message)
  );
}

// Best-effort cleanup of large but disposable entries when storage is full.
const DISPOSABLE_KEYS: StorageKey[] = [
  STORAGE_KEYS.history,
  STORAGE_KEYS.recentSearches,
  STORAGE_KEYS.adminPushHistory,
];

function evictDisposable(): boolean {
  if (!hasWindow()) return false;
  let freed = false;
  for (const k of DISPOSABLE_KEYS) {
    try { if (window.localStorage.getItem(k)) { window.localStorage.removeItem(k); freed = true; } } catch { /* ignore */ }
  }
  return freed;
}

export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    if (!hasWindow()) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      // Corrupted JSON: discard the bad value so we recover next write.
      try { window.localStorage.removeItem(key); } catch { /* ignore */ }
      return fallback;
    }
  },

  set(key: string, value: unknown): boolean {
    if (!hasWindow()) return false;
    const payload = JSON.stringify(value);
    try {
      window.localStorage.setItem(key, payload);
      dispatchChange(key);
      return true;
    } catch (err) {
      if (isQuotaError(err) && evictDisposable()) {
        try {
          window.localStorage.setItem(key, payload);
          dispatchChange(key);
          return true;
        } catch { /* fall through */ }
      }
      return false;
    }
  },

  remove(key: string): void {
    if (!hasWindow()) return;
    try { window.localStorage.removeItem(key); dispatchChange(key); } catch { /* ignore */ }
  },

  // Raw string accessors for the few callers that don't serialize JSON.
  getString(key: string, fallback = ''): string {
    if (!hasWindow()) return fallback;
    try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },

  setString(key: string, value: string): boolean {
    if (!hasWindow()) return false;
    try { window.localStorage.setItem(key, value); dispatchChange(key); return true; }
    catch (err) {
      if (isQuotaError(err) && evictDisposable()) {
        try { window.localStorage.setItem(key, value); dispatchChange(key); return true; } catch { /* ignore */ }
      }
      return false;
    }
  },
};

function dispatchChange(key: string) {
  try { window.dispatchEvent(new Event(`storage:${key}`)); } catch { /* ignore */ }
}

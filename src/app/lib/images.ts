// Rewrite Unsplash URLs to a sensible width and quality, and detect data-saver
// mode from localStorage so callers can downgrade transparently.
import { safeStorage, STORAGE_KEYS } from './storage-safe';

export function isDataSaver(): boolean {
  return safeStorage.get<boolean>(STORAGE_KEYS.dataSaver, false) === true;
}

export function optimizedUnsplash(src: string, width = 800, quality = 70): string {
  if (!src) return src;
  if (!src.includes('images.unsplash.com')) return src;
  const w = isDataSaver() ? Math.min(width, 480) : width;
  const q = isDataSaver() ? Math.min(quality, 55) : quality;
  try {
    const u = new URL(src);
    u.searchParams.set('w', String(w));
    u.searchParams.set('q', String(q));
    u.searchParams.set('auto', 'format');
    return u.toString();
  } catch {
    return src;
  }
}

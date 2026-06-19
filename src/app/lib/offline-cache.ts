// IndexedDB-backed cache for GET responses. Used by api.ts to deliver a
// stale-while-revalidate experience: instant render from cache (works
// offline) and a silent refresh in the background.

const DB_NAME = 'ippoo-offline';
const STORE = 'http';
// Keep in sync with offline-queue.ts — same DB, single upgrade path.
const VERSION = 2;

interface Entry {
  key: string;
  body: unknown;
  ts: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('indexedDB unavailable'));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('idb open failed'));
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDb().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export async function cacheGet<T = unknown>(key: string): Promise<T | undefined> {
  try {
    const store = await tx('readonly');
    return await new Promise<T | undefined>((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as Entry | undefined)?.body as T | undefined);
      req.onerror = () => resolve(undefined);
    });
  } catch { return undefined; }
}

export async function cacheSet(key: string, body: unknown): Promise<void> {
  try {
    const store = await tx('readwrite');
    await new Promise<void>((resolve) => {
      const req = store.put({ key, body, ts: Date.now() } satisfies Entry);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch { /* ignore — cache is best-effort */ }
}

export async function cacheClear(): Promise<void> {
  try {
    const store = await tx('readwrite');
    await new Promise<void>((resolve) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch { /* ignore */ }
}

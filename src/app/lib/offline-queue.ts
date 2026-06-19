// IndexedDB-backed FIFO queue of mutations that failed because the user
// is offline (or the network glitched). On reconnect — and on app start —
// the queue is drained one entry at a time with exponential backoff per
// entry. Successful entries are removed; entries that exceed the retry
// budget are kept with `dead: true` so the UI can surface them.
//
// Design choices:
// - Only authenticated POST/PUT/DELETE land here. GETs use the SWR cache.
// - We capture the Bearer token at enqueue time so a token refresh doesn't
//   leave dangling Authorization headers; we re-resolve at drain time.
// - One drain at a time per tab (an in-memory lock). Multiple tabs can
//   each drain — duplicates are absorbed by server idempotency.

const DB_NAME = 'ippoo-offline';
const STORE = 'queue';
const VERSION = 2;
const MAX_RETRIES = 6;

export interface QueueEntry {
  id: string;
  ts: number;
  path: string;
  method: string;
  body: unknown;
  auth: boolean;
  retries: number;
  lastError?: string;
  dead?: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('indexedDB unavailable'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('http')) db.createObjectStore('http', { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('idb open failed'));
  });
  return dbPromise;
}

function store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDb().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export async function enqueue(input: Omit<QueueEntry, 'id' | 'ts' | 'retries'>): Promise<string> {
  const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: QueueEntry = { id, ts: Date.now(), retries: 0, ...input };
  const s = await store('readwrite');
  await new Promise<void>((resolve) => {
    const req = s.add(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
  emitChange();
  return id;
}

export async function listQueue(): Promise<QueueEntry[]> {
  try {
    const s = await store('readonly');
    return await new Promise<QueueEntry[]>((resolve) => {
      const req = s.getAll();
      req.onsuccess = () => {
        const all = (req.result as QueueEntry[]).sort((a, b) => a.ts - b.ts);
        resolve(all);
      };
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

export async function queueSize(): Promise<number> {
  const items = await listQueue();
  return items.filter((e) => !e.dead).length;
}

async function update(entry: QueueEntry): Promise<void> {
  const s = await store('readwrite');
  await new Promise<void>((resolve) => {
    const req = s.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

async function remove(id: string): Promise<void> {
  const s = await store('readwrite');
  await new Promise<void>((resolve) => {
    const req = s.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

export async function clearDead(): Promise<void> {
  const items = await listQueue();
  for (const e of items) if (e.dead) await remove(e.id);
  emitChange();
}

let draining = false;

type Sender = (entry: QueueEntry) => Promise<void>;

export async function drain(send: Sender): Promise<{ ok: number; failed: number }> {
  if (draining) return { ok: 0, failed: 0 };
  draining = true;
  let ok = 0, failed = 0;
  try {
    const items = await listQueue();
    for (const e of items) {
      if (e.dead) continue;
      // Per-entry backoff: skip entries whose next retry isn't due yet.
      const wait = Math.min(60_000, 1000 * Math.pow(2, e.retries));
      if (Date.now() - e.ts < wait && e.retries > 0) continue;
      try {
        await send(e);
        await remove(e.id);
        ok++;
      } catch (err) {
        const next: QueueEntry = {
          ...e,
          retries: e.retries + 1,
          lastError: err instanceof Error ? err.message : String(err),
          ts: Date.now(),
          dead: e.retries + 1 >= MAX_RETRIES,
        };
        await update(next);
        failed++;
        // Stop draining the rest on a network failure — they'll all fail too.
        if (isNetworkError(err)) break;
      }
    }
  } finally {
    draining = false;
    emitChange();
  }
  return { ok, failed };
}

function isNetworkError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return /network|failed to fetch|load failed|offline/i.test(e.message);
}

const CHANGE_EVENT = 'ippoo:queue-change';
function emitChange() {
  try { window.dispatchEvent(new Event(CHANGE_EVENT)); } catch { /* ignore */ }
}
export const QUEUE_CHANGE_EVENT = CHANGE_EVENT;

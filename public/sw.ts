/* IPPOO Social-Fact — service worker source.
 * Deploy this file as `/sw.js` at the site root so its scope covers the
 * whole app. In Vite, copy it to the build output via the `public/`
 * convention or a build plugin (see lib/pwa.ts for registration).
 *
 * Two jobs: app-shell offline fallback, and Web Push delivery.
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const SHELL_CACHE = 'ippoo-shell-v1';
const SHELL_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_URLS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Network-first for navigations with cache fallback (lets the SPA boot offline).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/', copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error())),
    );
  }
});

// Web Push — server sends { title, body, url }.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data: { title?: string; body?: string; url?: string; tag?: string } = {};
  try { data = event.data.json(); } catch { data = { title: 'IPPOO', body: event.data.text() }; }
  const title = data.title || 'IPPOO';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'ippoo',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          (client as WindowClient).navigate(url);
          return (client as WindowClient).focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

export {};

/* Feeling Catchers — service worker
 *
 * Strategy: precache the whole app shell (it is small and completely static),
 * then serve cache-first. There is no dynamic content and no network calls in
 * the app, so "offline" is the normal case rather than a fallback.
 *
 * Bump CACHE_VERSION on every deploy. The old cache is deleted on activate,
 * and the page is told a new version is waiting so it can offer a reload.
 */

const CACHE_VERSION = 'fc-v0.8.0';

/* Relative paths so the app works from a subdirectory
   (GitHub Pages project sites, /apps/feelings/, etc.) */
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // addAll is atomic: one 404 fails the whole install, which is what we want
    // (a half-cached shell that breaks offline is worse than no update).
    await cache.addAll(PRECACHE);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // never touch cross-origin

  /* Navigations: cache-first on the shell, so a cold offline launch works.
     Falls back to index.html for any in-scope path (deep links, ?go= shortcuts). */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match('./index.html');
      if (cached) {
        // Refresh in the background; never block the launch on the network.
        fetch(req).then(res => { if (res && res.ok) cache.put('./index.html', res.clone()); }).catch(() => {});
        return cached;
      }
      try { return await fetch(req); }
      catch (e) { return new Response('Offline and nothing cached yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } }); }
    })());
    return;
  }

  /* Everything else: cache-first, then network, then cache the result. */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});

/* The page posts SKIP_WAITING when the parent taps "Update now". */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source && event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
});

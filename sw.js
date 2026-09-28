/*
 * Offline support: once a guest has opened the invitation, it opens again
 * without signal (handy at the venue). Bump VERSION after each deploy.
 *
 *  - This site's own files: network first, so guests always get your latest text
 *    and code, falling back to the saved copy when offline.
 *  - Google Fonts and CDN libraries: served from the cache, refreshed in the background.
 */
const VERSION = 'gp-v4';
const CORE = [
  './',
  'index.html',
  'card.html',
  'config.js',
  'assets/css/invite.css',
  'assets/css/card.css',
  'assets/js/poster.js',
  'assets/js/card.js',
  'assets/js/core.js',
  'assets/js/art.js',
  'assets/js/music.js',
  'assets/js/invite.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true }))
      || (req.mode === 'navigate' ? cache.match('index.html') : undefined)
      || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  const fresh = fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fresh;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(networkFirst(req));
    return;
  }

  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname)) {
    e.respondWith(staleWhileRevalidate(req));
  }
});

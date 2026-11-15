// Service worker: keeps the app working offline.
// Bump VERSION on every release so phones pick up the new files.
const VERSION = 'v2-2026-11-15';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'stations.json',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'lib/leaflet/leaflet.js', 'lib/leaflet/leaflet.css'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (so updates arrive), cache as fallback when offline.
// Map tiles are not cached: they come straight from OpenStreetMap.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const cacheable = url.origin === self.location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com');
  if (!cacheable) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

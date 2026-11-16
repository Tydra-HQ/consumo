// Service worker: keeps the app working offline.
// Bump VERSION on every release so phones pick up the new files.
const VERSION = 'v15-2026-11-16';
const V = '?v=15'; // igual que en index.html: cada versión usa nombres nuevos y el teléfono no reutiliza archivos viejos
const FILES = ['./', 'index.html', 'styles.css' + V, 'app.js' + V, 'stations.json', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'leaflet.js' + V, 'leaflet.css' + V, 'supabase.js' + V, 'cloud.js' + V, 'trips.js' + V];

self.addEventListener('install', (e) => {
  // Each file is cached on its own: one missing file must not break the whole install
  e.waitUntil(caches.open(VERSION)
    .then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => null))))
    .then(() => self.skipWaiting()));
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
    fetch(e.request, { cache: 'no-cache' }) // siempre pregunta al servidor si hay versión nueva
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

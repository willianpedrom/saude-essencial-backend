// Minimal Service Worker — required for PWA install prompt
// v3: 2026-03 — bust cache to pick up new routes (estoque)
const CACHE_NAME = 'gota-app-v3';
const PRECACHE = ['/', '/css/index.css', '/logo.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Network-first for API calls, cache-first for static assets
    if (e.request.url.includes('/api/')) return;
    e.respondWith(
        fetch(e.request)
            .then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});

// Minimal Service Worker — required for PWA install prompt
// v5: 2026-04 — bust cache to pick up database compras migration
const CACHE_NAME = 'gota-app-v6';
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

/* ─── WEB PUSH NOTIFICATIONS ─── */

self.addEventListener('push', e => {
    try {
        const data = e.data ? e.data.json() : { title: 'Gota App', body: 'Nova notificação recebida.' };
        const options = {
            body: data.body || '',
            icon: data.icon || '/icon-512.png',
            badge: '/icon-512.png',
            vibrate: [100, 50, 100],
            data: data.data || {}
        };
        e.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (err) {
        console.error('[SW] Push error:', err);
    }
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    const urlToOpen = e.notification.data?.url || '/';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let client of windowClients) {
                if ('focus' in client) {
                    client.postMessage({ type: 'navigate', url: urlToOpen });
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

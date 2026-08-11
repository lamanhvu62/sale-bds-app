const CACHE_NAME = 'salebds-v1';

self.addEventListener('install', event => {
    self.skipWaiting(); // Tự động kích hoạt bản mới
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// ===== THÊM PHẦN PUSH =====
self.addEventListener('push', event => {
    const data = event.data?.json() || {};
    const options = {
        body: data.body || 'Bạn có lịch hẹn sắp đến',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
            url: data.url || '/lich-hen'
        },
        vibrate: [200, 100, 200],
        tag: 'appointment-reminder'
    };
    event.waitUntil(
        self.registration.showNotification(data.title || 'SaleBDS', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || '/lich-hen';
    event.waitUntil(
        clients.openWindow(url)
    );
});
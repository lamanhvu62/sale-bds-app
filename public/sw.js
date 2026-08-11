// Tên cache
const CACHE_NAME = 'salebds-v1';

// Sự kiện install: cache các tài nguyên tĩnh
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/dashboard',
                '/khach-hang',
                '/du-an',
                '/lich-hen',
                '/calculator',
            ]);
        })
    );
});

// Sự kiện fetch: ưu tiên lấy từ cache (offline), nếu không có thì lấy từ mạng
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});

// Sự kiện activate: dọn dẹp cache cũ
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});
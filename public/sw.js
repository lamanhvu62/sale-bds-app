const CACHE_NAME = 'salebds-v1';

// Cài đặt và cache tài nguyên tĩnh (chỉ GET)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                // Thêm các file tĩnh khác nếu cần
            ]);
        })
    );
});

// Xử lý fetch: chỉ cache GET requests
self.addEventListener('fetch', event => {
    // Bỏ qua non-GET requests
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Trả về từ cache nếu có, nếu không thì fetch từ mạng
            return cachedResponse || fetch(event.request).then(response => {
                // Có thể cache lại response nếu muốn (dynamic caching)
                // Nhưng hiện tại chỉ trả về, không cache thêm
                return response;
            });
        })
    );
});

// Xóa cache cũ khi kích hoạt
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const options = {
        body: data.body || 'Bạn có lịch hẹn sắp đến',
        icon: '/icon-192.png', // bạn cần có ảnh icon trong public
        badge: '/badge-72.png',
        data: {
            url: data.url || '/lich-hen'
        },
        vibrate: [200, 100, 200],
        tag: data.tag || 'appointment-reminder'
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SaleBDS', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/lich-hen';
    event.waitUntil(
        clients.openWindow(url)
    );
});
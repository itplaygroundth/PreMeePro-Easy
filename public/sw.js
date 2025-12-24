
// Service Worker for Web Push Notifications

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification',
            icon: '/icon-192x192.png', // Ensure this icon exists or use a default
            badge: '/badge-72x72.png',   // Optional
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1,
                url: data.data?.url || '/'
            },
            actions: [
                { action: 'explore', title: 'View Details' },
                { action: 'close', title: 'Close' }
            ]
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Notification', options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

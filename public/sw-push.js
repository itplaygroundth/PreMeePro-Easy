// Custom Service Worker for Web Push Notifications
// This file will be imported by the main service worker

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification',
      icon: '/pwa-192x192.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      tag: data.tag || 'default',
      renotify: true,
      data: {
        dateOfArrival: Date.now(),
        url: data.data?.url || '/'
      },
      actions: [
        { action: 'open', title: 'เปิดดู' },
        { action: 'close', title: 'ปิด' }
      ]
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'PreMeePro', options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (event.notification.data.url && event.notification.data.url !== '/') {
            client.navigate(event.notification.data.url);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});

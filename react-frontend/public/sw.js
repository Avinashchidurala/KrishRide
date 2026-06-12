// Service Worker for Web Push Notifications
const CACHE_NAME = 'hushryd-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {
    title: 'HushRyd',
    body: 'You have a new notification',
    icon: '/images/icon.png',
    badge: '/images/icon.png',
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image || undefined,
        data: data.data || {},
        tag: data.tag || undefined,
        requireInteraction: data.requireInteraction || false,
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
      actions: notificationData.data.actions
        ? JSON.parse(notificationData.data.actions)
        : [],
    })
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let url = '/';

  // Determine URL based on notification data
  if (notificationData.url) {
    url = notificationData.url;
  } else if (notificationData.bookingId) {
    url = `/customer/booking/${notificationData.bookingId}`;
  } else if (notificationData.type === 'booking') {
    url = '/customer/my-bookings';
  } else if (notificationData.type === 'sos') {
    url = '/admin/sos-alerts';
  }

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


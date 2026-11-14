/* eslint-disable no-undef */
importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyC8jLI7hvrcsGNCgmDyjUv695H8y0k_OHQ',
  authDomain: 'crossfitebber.firebaseapp.com',
  projectId: 'crossfitebber',
  storageBucket: 'crossfitebber.firebasestorage.app',
  messagingSenderId: '364035435385',
  appId: '1:364035435385:web:b06299ccc9b8c3e9351da8',
  measurementId: 'G-DY5EJ2LSTB',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    (payload && payload.notification && payload.notification.title) ||
    'Crossfit Ebber · Hora do Treino!';
  const body =
    (payload && payload.notification && payload.notification.body) ||
    'Seu treino de hoje está esperando no box. Bora manter o foguinho aceso!';

  self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'crossfit-ebber-wod-reminder',
    data: {
      url: '/#wod-ranking',
    },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/#wod-ranking';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});

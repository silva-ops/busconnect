// Service Worker - BusConnect (motorista)

self.addEventListener('install', (event) => {
  console.log('[sw] instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[sw] ativado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[sw-mot] push recebido');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { titulo: 'BusConnect', corpo: event.data ? event.data.text() : '' };
  }

  const titulo = data.titulo || 'BusConnect';
  const corpo = data.corpo || 'Nova notificacao';
  const vibrar = data.vibrar || [300, 100, 300, 100, 300];

  event.waitUntil(self.registration.showNotification(titulo, {
    body: corpo,
    vibrate: vibrar,
    tag: data.tag || 'motorista-parada',
    renotify: true,
    requireInteraction: data.persistente || false,
    data: { url: data.url || '/' },
    silent: false,
  }));
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.tipo !== 'notificar') return;

  self.registration.showNotification(data.titulo || 'BusConnect', {
    body: data.corpo || '',
    vibrate: data.vibrar || [300, 100, 300, 100, 300],
    tag: data.tag || 'motorista-parada',
    renotify: true,
    requireInteraction: data.persistente || false,
    data: { url: data.url || '/' },
    silent: false,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
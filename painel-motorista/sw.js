// Service Worker - BusConnect (motorista)

self.addEventListener('install', (event) => {
  console.log('[sw] instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[sw] ativado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.tipo !== 'notificar') return;

  const titulo = data.titulo || 'BusConnect';
  const corpo = data.corpo || '';
  const vibrar = data.vibrar || [300, 100, 300, 100, 300];

  self.registration.showNotification(titulo, {
    body: corpo,
    vibrate: vibrar,
    tag: data.tag || 'motorista-parada',
    renotify: true,
    requireInteraction: data.persistente || false,
    data: { url: data.url || '/' },
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
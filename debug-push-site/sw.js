// Service Worker - BusConnect
// Roda em background e recebe push + mensagens do app principal

self.addEventListener('install', (event) => {
  console.log('[sw] instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[sw] ativado');
  event.waitUntil(self.clients.claim());
});

// ===== PUSH (vindo do servidor) =====
self.addEventListener('push', (event) => {
  console.log('[sw] push recebido');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { titulo: 'BusConnect', corpo: event.data ? event.data.text() : '' };
  }

  const titulo = data.titulo || 'BusConnect';
  const corpo = data.corpo || 'Nova notificacao';
  const vibrar = data.vibrar || [300, 100, 300];

  const options = {
    body: corpo,
    icon: data.icon || '/favicon.ico',
    badge: data.icon || '/favicon.ico',
    vibrate: vibrar,
    tag: data.tag || 'busconnect-aviso',
    renotify: true,
    requireInteraction: data.persistente || false,
    data: { url: data.url || '/' },
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(titulo, options));
});

// ===== MENSAGENS DO APP PRINCIPAL =====
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.tipo !== 'notificar') return;

  const titulo = data.titulo || 'BusConnect';
  const corpo = data.corpo || '';
  const vibrar = data.vibrar || [300, 100, 300];

  self.registration.showNotification(titulo, {
    body: corpo,
    icon: data.icon || '/favicon.ico',
    badge: data.icon || '/favicon.ico',
    vibrate: vibrar,
    tag: data.tag || 'busconnect-aviso',
    renotify: true,
    requireInteraction: data.persistente || false,
    data: { url: data.url || '/' },
    silent: false,
  });
});

// ===== CLIQUE NA NOTIFICACAO =====
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
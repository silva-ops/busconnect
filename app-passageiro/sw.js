// Service Worker - BusConnect v2
// Cache + auto-update + push

const SW_VERSION = 'busconnect-v3';
const CACHE_STATIC = SW_VERSION + '-static';
const CACHE_IMAGES = SW_VERSION + '-images';

const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './config.js',
  './push-client.js',
  './manifest.json',
];

// ===== INSTALL =====
self.addEventListener('install', (event) => {
  console.log('[sw] instalando', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((e) => {
        console.warn('[sw] pre-cache parcial:', e.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', (event) => {
  console.log('[sw] ativando', SW_VERSION);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_IMAGES)
          .map((key) => {
            console.log('[sw] apagando cache antigo:', key);
            return caches.delete(key);
          })
      );
    })
    .then(() => self.clients.claim())
    .then(() => {
      // Avisa todas as abas que o SW foi atualizado
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ tipo: 'SW_UPDATED', versao: SW_VERSION });
        });
      });
    })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isEsri = url.hostname.includes('arcgisonline.com');

  // Cross-origin (backend, socket.io, unpkg, esri) — deixa passar
  if (!sameOrigin && !isEsri) return;

  const isHTML = req.headers.get('accept')?.includes('text/html')
    || url.pathname === '/' || url.pathname.endsWith('.html');
  const isJS = url.pathname.endsWith('.js');
  const isCSS = url.pathname.endsWith('.css');
  const isJSON = url.pathname.endsWith('.json');

  // HTML/JS/CSS/JSON: network-first (sempre pega versao nova se estiver online)
  if (isHTML || isJS || isCSS || isJSON) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => {
          return caches.match(req).then((cached) => cached || caches.match('./index.html'));
        })
    );
    return;
  }

  // Imagens/tiles: cache-first
  if (req.destination === 'image' || isEsri) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_IMAGES).then((cache) => cache.put(req, clone));
          }
          return resp;
        });
      })
    );
  }
});

// ===== PUSH =====
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
  event.waitUntil(self.registration.showNotification(titulo, {
    body: corpo,
    icon: data.icon || '/favicon.ico',
    badge: data.icon || '/favicon.ico',
    vibrate: vibrar,
    tag: data.tag || 'busconnect-aviso',
    renotify: true,
    requireInteraction: data.persistente || false,
    data: { url: data.url || '/' },
    silent: false,
  }));
});

// ===== MENSAGENS =====
self.addEventListener('message', (event) => {
  const data = event.data;

  if (data && data.tipo === 'SKIP_WAITING') {
    console.log('[sw] recebido SKIP_WAITING');
    self.skipWaiting();
    return;
  }

  if (!data || data.tipo !== 'notificar') return;

  self.registration.showNotification(data.titulo || 'BusConnect', {
    body: data.corpo || '',
    icon: data.icon || '/favicon.ico',
    badge: data.icon || '/favicon.ico',
    vibrate: data.vibrar || [300, 100, 300],
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
// Service Worker para NOC & Guardias PWA
// Permite uso offline guardando en caché los recursos principales

const CACHE_NAME = 'noc-guardias-v1';
const ASSETS = [
  './',
  './noc_guardias_app.html',
  './manifest.json',
  './favicon.ico',
  './icons/icon-16x16.png',
  './icons/icon-32x32.png',
  './icons/icon-48x48.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
];

// Instalar: guardar recursos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Error cacheando algunos recursos:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: servir desde caché, o red si no está
self.addEventListener('fetch', (event) => {
  // No interceptar requests a Firestore/Firebase
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebaseio.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Si está en caché, usarlo; sino, fetch desde la red
      const fetchPromise = fetch(event.request).then((response) => {
        // Guardar en caché solo respuestas válidas
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Si no hay red ni caché, responder con la página principal
        if (event.request.mode === 'navigate') {
          return caches.match('./noc_guardias_app.html');
        }
      });
      return cached || fetchPromise;
    })
  );
});

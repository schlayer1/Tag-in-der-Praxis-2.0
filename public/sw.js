// Service Worker with Network-First navigation to prevent stale index.html white screens
const CACHE_NAME = 'tip-kahla-cache-v3';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/app-icon.png',
  '/apple-touch-icon.png',
  '/Siegel_bunt.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache error:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Purge all old caches (including tip-kahla-cache-v1 and v2)
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Do not intercept external APIs (Firestore, Gemini, Google Fonts)
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('generativelanguage.googleapis.com') ||
    url.origin.includes('googleapis.com') ||
    url.origin.includes('gstatic.com')
  ) {
    return;
  }

  // 1. Navigation requests (HTML): NETWORK-FIRST
  // Always fetch the freshest index.html when online to get the correct asset hashes!
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached index.html only when strictly offline
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. Static assets & bundles: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Avoid caching HTML responses for JS/CSS requests (Vercel rewrite fallback)
        const contentType = networkResponse.headers.get('content-type') || '';
        if (
          (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) &&
          contentType.includes('text/html')
        ) {
          return networkResponse;
        }

        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });

        return networkResponse;
      });
    })
  );
});

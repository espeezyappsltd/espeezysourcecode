const CACHE_NAME = 'espeezy-v2';
const ASSETS_TO_CACHE = [
  '/favicon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/_next/static/', // Next.js static assets
  '/offline', // Offline game route (should render OfflineGame)
];

// Install Event: Precaching App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-first with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optionally cache successful responses
        return response;
      })
      .catch(() => {
        // If offline and request is for a navigation, show offline game
        if (event.request.mode === 'navigate') {
          return caches.match('/offline');
        }
        return caches.match(event.request);
      })
  );
});

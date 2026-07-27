/* ============================================
   COMMUNITY RUBBER PLANTATION PWA - SERVICE WORKER
   Staging Environment (rubber-plantation-app-testing)
   ============================================ */

const CACHE_NAME = 'rubber-app-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css?v=2.0',
  './app.js?v=2.0',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192.svg',
  './icon-512.svg',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install Event — Pre-cache all static resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing SW & Caching Assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static files...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Cache addAll partial fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating New SW Version...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Skip non-GET requests or non-HTTP requests
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        console.log('[Service Worker] Network offline, serving from cache:', req.url);
        const cachedResponse = await caches.match(req);
        if (cachedResponse) return cachedResponse;

        if (req.mode === 'navigate') {
          return (await caches.match('./index.html')) || (await caches.match('./'));
        }
      })
  );
});

// Listen for update message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

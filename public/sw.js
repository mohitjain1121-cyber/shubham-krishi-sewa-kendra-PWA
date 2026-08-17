const CACHE_NAME = 'sksk-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/logo192.png',
  '/logo512.png'
];

// Install event: Pre-cache static shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Apply appropriate caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Bypass caching for non-GET requests (e.g. POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Bypass caching for dynamic/external data (e.g. Supabase, external APIs)
  // Check if it's an API call or external resource that shouldn't be cached statically
  const isExternalOrApi = requestUrl.origin !== self.location.origin || 
                          requestUrl.pathname.includes('/rest/v1/') ||
                          requestUrl.pathname.includes('/api/');
  
  if (isExternalOrApi) {
    event.respondWith(fetch(event.request).catch((err) => {
      console.log('[Service Worker] Dynamic network request failed offline:', err);
      // Return empty/offline indicator response if needed, or let it fail naturally
    }));
    return;
  }

  // 3. Network-First / Stale-While-Revalidate for critical metadata / index pages
  // This ensures users receive the latest index.html (and therefore the latest hashes for bundles)
  const isDocumentOrManifest = requestUrl.pathname === '/' || 
                               requestUrl.pathname === '/index.html' || 
                               requestUrl.pathname === '/manifest.webmanifest';

  if (isDocumentOrManifest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Cache-First with Network Fallback for static assets
  // Hashed Vite bundle assets (/assets/*) are immutable, so they can be served directly from cache.
  // Other images, SVGs, etc., can also use cache-first.
  const isStaticAsset = requestUrl.pathname.startsWith('/assets/') ||
                        requestUrl.pathname.endsWith('.png') ||
                        requestUrl.pathname.endsWith('.jpg') ||
                        requestUrl.pathname.endsWith('.jpeg') ||
                        requestUrl.pathname.endsWith('.svg') ||
                        requestUrl.pathname.endsWith('.woff') ||
                        requestUrl.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          // If we got a valid response, cache it
          if (networkResponse && networkResponse.status === 200) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Default strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        }
        return networkResponse;
      }).catch(() => {
        // Suppress errors for offline fetch failures in stale-while-revalidate
      });

      return cachedResponse || fetchPromise;
    })
  );
});

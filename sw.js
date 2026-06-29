const CACHE_NAME = 'motjo-library-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './library.html',
  './novel.html',
  './reader.html',
  './css/style.css',
  './js/auth.js',
  './js/app.js',
  './js/library.js',
  './js/reader.js',
  './manifest.json',
  './assets/hero-study.jpg',
  './assets/motjo-mascot.webp',
  './assets/bratasena/season-01.webp',
  './assets/bratasena/season-02.webp',
  './assets/bratasena/season-03.webp',
  './assets/bratasena/season-04.webp'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network First, fallback to cache)
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local origins
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid response, clone and save to cache
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(e.request);
      })
  );
});

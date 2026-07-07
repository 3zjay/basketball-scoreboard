// Service Worker — enables PWA install on Android & iOS
const CACHE = 'scoreboard-v3';
const ASSETS = [
  '/control',
  '/shotclock',
  '/manifest.json',
  '/hoop-culture-logo.png',
  '/hoop-culture-logo.jpg',
  '/buzzer.mp3',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network first — always get fresh data, fall back to cache if offline
self.addEventListener('fetch', e => {
  // Only intercept same-origin GET requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request, { ignoreSearch: true }).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        // Return a valid response instead of undefined to prevent WebKit process crashes
        return new Response("Connection lost — offline.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

// Service Worker — enables PWA install on Android & iOS
const CACHE = 'scoreboard-v1';
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
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

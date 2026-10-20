'use strict';

const CACHE_NAME = 'chaka-v2';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const OFFLINE_FALLBACK = 'emergency.html';
const PRECACHE_URLS = [
  './',
  'calculators.html',
  'clinics.html',
  'css/animations.css',
  'css/components.css',
  'css/features.css',
  'css/layout.css',
  'css/pages.css',
  'css/photos.css',
  'css/responsive.css',
  'css/style.css',
  'diary.html',
  'emergency.html',
  'img/care-doctor-blocks.webp',
  'img/icons/apple-touch-icon.png',
  'img/icons/icon-192.png',
  'img/icons/icon-512.png',
  'img/icons/icon-maskable-512.png',
  'img/lib/allergy.webp',
  'img/lib/asthma.webp',
  'img/lib/dm.webp',
  'img/lib/flu.webp',
  'img/lib/gastritis.webp',
  'img/lib/heartdiet.webp',
  'img/lib/htn.webp',
  'img/lib/migraine.webp',
  'img/lib/sleep.webp',
  'img/lib/stress.webp',
  'img/lib/vitd.webp',
  'img/nurse-stethoscope.webp',
  'img/stethoscope-teal.webp',
  'index.html',
  'js/calc-defs.js',
  'js/calculators.js',
  'js/clinics-data.js',
  'js/contact.js',
  'js/data.js',
  'js/diary.js',
  'js/doctors.js',
  'js/effects.js',
  'js/emergency.js',
  'js/firstaid.js',
  'js/georgia-geo.js',
  'js/i18n-en-features.js',
  'js/i18n-en.js',
  'js/i18n.js',
  'js/lab-defs.js',
  'js/labs.js',
  'js/library.js',
  'js/logos.js',
  'js/main.js',
  'js/map.js',
  'js/page-clinics.js',
  'js/page.js',
  'js/prep.js',
  'js/pwa.js',
  'js/symptoms.js',
  'js/tools.js',
  'js/utils.js',
  'labs.html',
  'manifest.webmanifest',
  'prep.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith('chaka-') && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

const putInCache = (request, response) => {
  if (!response || (response.status !== 200 && response.type !== 'opaque')) return response;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
};

const networkFirst = (request) => fetch(request)
  .then((response) => putInCache(request, response))
  .catch(() => caches.match(request, { ignoreSearch: true }).then((cached) => cached || caches.match(OFFLINE_FALLBACK)));

const staleWhileRevalidate = (request) => caches.match(request).then((cached) => {
  const refresh = fetch(request).then((response) => putInCache(request, response)).catch(() => cached);
  return cached || refresh;
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.origin === self.location.origin || FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

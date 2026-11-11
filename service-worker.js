const CACHE_NAME = 'tmi-pwa-v10';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Bibliothèques externes (versions fixes) : mises en cache dès l'installation
// pour que l'application démarre complètement hors ligne.
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/lucide@0.378.0/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// Requête CORS (réponse lisible et vérifiable, jamais "opaque")
const corsFetch = url => fetch(new Request(url, { mode: 'cors', credentials: 'omit' }));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await Promise.all(CDN_ASSETS.map(async url => {
      try {
        const res = await corsFetch(url);
        if (res && res.ok) await cache.put(url, res);
      } catch (e) { /* sera mis en cache à la première utilisation */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase (API / auth) : toujours le réseau, jamais de cache.
  if (url.hostname.includes('supabase')) return;

  // Navigation : réseau (max 3,5 s), sinon la copie enregistrée de l'application.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await Promise.race([
          fetch(request),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (response && response.ok) cache.put('./index.html', response.clone());
        return response;
      } catch (e) {
        return (await cache.match('./index.html')) ||
               (await cache.match('./')) ||
               Response.error();
      }
    })());
    return;
  }

  const isCdn = CDN_HOSTS.includes(url.hostname);
  if (url.origin !== self.location.origin && !isCdn) return;

  // Ressources de l'application et bibliothèques : cache d'abord, mise à jour en arrière-plan.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreVary: true });
    const update = (isCdn ? corsFetch(request.url) : fetch(request))
      .then(response => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);
    if (cached) {
      event.waitUntil(update);
      return cached;
    }
    return (await update) || Response.error();
  })());
});

// ===== Notifications push =====
self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'TMI', {
    body: d.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: d.tag || 'tmi-post',
    renotify: true,
    data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.postMessage({ type: 'OPEN_HOME' }); return c.focus(); }
      }
      return self.clients.openWindow((event.notification.data && event.notification.data.url) || './');
    })
  );
});

// Build replaces both placeholders with this release's exact static-file allowlist.
const CACHE = 'date-plan-shell-__VERSION__';
const FILES = __FILES__;
const root = new URL(self.registration.scope);
const allowed = new Set(FILES.map((path) => new URL(path, root).href));
const offline = new URL('offline.html', root).href;
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([...allowed])));
  // A new release waits: never reload a form that the user is still filling in.
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('date-plan-shell-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== root.origin ||
    !url.pathname.startsWith(root.pathname)
  )
    return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.open(CACHE)).match(offline)));
    return;
  }
  // No API data, auth responses, query strings, or other apps enter this cache.
  if (!allowed.has(url.href)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => (await cache.match(request)) || fetch(request)),
  );
});

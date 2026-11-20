/* OFFLINE_BUILD */
// This file is packaged by scripts/build-offline.mjs; it is not served in development.
const prefix = `biology-zoomout:${self.registration.scope}:`;
const cacheName = prefix + BUILD.version;
const urlFor = path => new URL(path, self.registration.scope).href;
const assetURLs = new Set(BUILD.files.map(file => urlFor(file.path)));

async function saveOffline() {
  const cache = await caches.open(cacheName);
  // addAll commits atomically. Integrity rejects a stale upload or an HTML fallback
  // masquerading as a missing asset, so a partial release never replaces this app.
  await cache.addAll(BUILD.files.map(file => new Request(urlFor(file.path), {
    cache: 'reload', integrity: file.integrity, credentials: 'same-origin',
  })));
}

self.addEventListener('install', event => {
  event.waitUntil(saveOffline().catch(async error => {
    await caches.delete(cacheName);
    throw error;
  }));
  // Updates wait until every old app window is closed. Never interrupt a lesson
  // or mix a new curriculum/model file with an older running application.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Hash routes all use this one shell. Leave unrelated URLs, external sources,
  // and the worker update request to the network.
  const isShell = request.mode === 'navigate' && (url.pathname === new URL(self.registration.scope).pathname || url.href.split('?')[0] === urlFor('index.html'));
  const key = isShell ? urlFor('index.html') : url.href;
  if (!isShell && !assetURLs.has(key)) return;
  event.respondWith((async () => (await (await caches.open(cacheName)).match(key)) || fetch(request))());
});

self.addEventListener('message', event => {
  if (!['OFFLINE_STATUS', 'REPAIR_OFFLINE'].includes(event.data?.type) || !event.ports[0]) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'REPAIR_OFFLINE') await saveOffline();
      const saved = new Set((await (await caches.open(cacheName)).keys()).map(request => request.url));
      event.ports[0].postMessage({ready: [...assetURLs].every(url => saved.has(url)), version: BUILD.version, bytes: BUILD.bytes});
    } catch {
      event.ports[0].postMessage({ready: false, error: true});
    }
  })());
});

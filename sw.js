const CACHE_NAME = "mohawk-hunt-v5";
const SHELL_URLS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // API: always network, never cached
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML / navigation: network-first, cache fallback for offline
  const isNavigation = req.mode === "navigate";
  const isHtml = url.pathname === "/" || url.pathname.endsWith(".html");
  if (isNavigation || isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  // Static shell assets (manifest, icons, etc.): cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

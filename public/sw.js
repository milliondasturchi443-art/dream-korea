const CACHE = "dk-shell-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll([OFFLINE, "/icon-512.png", "/manifest.webmanifest"]).catch(() => {})
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Static assets: cache-first (immutable / hashed)
  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((resp) => {
            if (resp && resp.ok) {
              const copy = resp.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return resp;
          })
      )
    );
    return;
  }

  // Page navigations (app open / hard load): stale-while-revalidate
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req, { ignoreSearch: true });
        const network = fetch(req)
          .then((resp) => {
            if (resp && resp.ok) cache.put(req, resp.clone());
            return resp;
          })
          .catch(() => cached || cache.match(OFFLINE));
        // Serve cache instantly if we have it; revalidate in background
        return cached || network;
      })
    );
  }
});

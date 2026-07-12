// Service worker ab caching nahi karta — sirf app ko installable banata hai.
// Purani caching ki wajah se stale/broken JS files serve ho rahi thi, jisse crash aata tha.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

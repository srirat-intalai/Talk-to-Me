/* เก็บไฟล์ของเว็บไว้ในเครื่อง ให้เปิดเล่นได้ตอนไม่มีเน็ต
   แก้รายการไฟล์ด้านล่างเมื่อไหร่ ให้เปลี่ยนเลขเวอร์ชันของ CACHE ด้วย */
const CACHE = "ttm-v1";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/core.js",
  "js/fx.js",
  "js/data/decks.js",
  "js/data/quizzes.js",
  "js/data/mysteries.js",
  "js/deeptalk.js",
  "js/quiz.js",
  "js/mystery.js",
  "js/main.js",
  "images/wish0.jpeg",
  "images/wish1.jpeg",
  "images/icon-192.png",
  "images/icon-512.png",
];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ตอบจาก cache ก่อนให้เปิดไว้ แล้วไปโหลดของใหม่มาเก็บไว้ใช้รอบหน้า
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin });
      const fresh = fetch(req)
        .then((res) => {
          // opaque (ฟอนต์ข้ามโดเมน) ก็เก็บได้ แต่ไม่เก็บหน้า error
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        e.waitUntil(fresh);
        return cached;
      }
      const res = await fresh;
      if (res) return res;
      if (req.mode === "navigate") return cache.match("index.html");
      return Response.error();
    }),
  );
});

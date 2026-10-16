/* เก็บไฟล์ของเว็บไว้ในเครื่อง ให้เปิดเล่นได้ตอนไม่มีเน็ต
   แก้รายการไฟล์ด้านล่างเมื่อไหร่ ให้เปลี่ยนเลขเวอร์ชันของ CACHE ด้วย */
// ทุกเวอร์ชันขึ้นต้นด้วย PREFIX ตอนล้างของเก่าจะลบเฉพาะของเว็บนี้
// (บน github.io หลายโปรเจกต์ใช้ origin เดียวกัน ถ้าลบหมดจะไปลบ cache ของเว็บอื่นด้วย)
const PREFIX = "ttm-";
const CACHE = PREFIX + "v5";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/fonts.css",
  "css/style.css",
  "js/icons.js",
  "js/core.js",
  "js/fx.js",
  "js/sound.js",
  "js/art.js",
  "js/fairy.js",
  "js/data/decks.js",
  "js/data/quizzes.js",
  "js/data/mysteries.js",
  "js/deeptalk.js",
  "js/quiz.js",
  "js/mystery.js",
  "js/main.js",
  "images/hero.jpg",
  "images/duo.jpg",
  "images/fly.jpg",
  "images/fairy-fly.jpg",
  "images/icon-192.png",
  "images/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ตอบจาก cache ก่อนให้เปิดไว้ แล้วไปโหลดของใหม่มาเก็บไว้ใช้รอบหน้า
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => {
          // ไม่เก็บหน้า error
          if (res.ok) cache.put(req, res.clone());
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

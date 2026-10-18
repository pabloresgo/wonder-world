// Offline support. On the first visit the browser saves every file listed
// below; after that the site opens straight from that saved copy, with or
// without internet. Online, each file is quietly re-downloaded in the
// background, so the next visit gets any updates.
//
// The list and version are written by tools/update-offline-list.py.
// Do not edit them by hand.

// VERSION-START
const CACHE = 'wonder-world-a06ebf71c4';
// VERSION-END

// FILES-START
const FILES = [
  "./",
  "./css/game.css",
  "./css/quiz.css",
  "./css/reading.css",
  "./css/style.css",
  "./games/animals/animals.js",
  "./games/animals/index.html",
  "./games/balance/balance.css",
  "./games/balance/balance.js",
  "./games/balance/index.html",
  "./games/creature/creature.css",
  "./games/creature/creature.js",
  "./games/creature/index.html",
  "./games/draw/draw.css",
  "./games/draw/draw.js",
  "./games/draw/index.html",
  "./games/hopper/hopper.css",
  "./games/hopper/hopper.js",
  "./games/hopper/index.html",
  "./games/letters/index.html",
  "./games/letters/letters.js",
  "./games/rhyme/index.html",
  "./games/rhyme/rhyme.css",
  "./games/rhyme/rhyme.js",
  "./games/space/index.html",
  "./games/space/space.css",
  "./games/space/space.js",
  "./games/story/index.html",
  "./games/story/story.css",
  "./games/story/story.js",
  "./games/ten-frame/index.html",
  "./games/ten-frame/ten-frame.css",
  "./games/ten-frame/ten-frame.js",
  "./games/weather/index.html",
  "./games/weather/weather.js",
  "./games/words/index.html",
  "./games/words/words.css",
  "./games/words/words.js",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./js/common/catalog.js",
  "./js/common/creature-art.js",
  "./js/common/game.js",
  "./js/common/progress.js",
  "./js/common/quiz.js",
  "./js/common/reading-data.js",
  "./js/common/sounds.js",
  "./js/common/speech.js",
  "./js/common/storage.js",
  "./js/common/ui.js",
  "./manifest.webmanifest",
  "./parent/index.html",
  "./parent/parent.css",
  "./parent/parent.js"
];
// FILES-END

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

// Remove copies saved by older versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('wonder-world-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameSite && !font) return;

  event.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(req, { ignoreSearch: sameSite });
    const fresh = fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);
    if (saved) {
      event.waitUntil(fresh);   // refresh in the background
      return saved;
    }
    const res = await fresh;
    if (res) return res;
    // Offline and never saved: fall back to the home page for page visits.
    return req.mode === 'navigate' ? cache.match('./index.html') : Response.error();
  }));
});

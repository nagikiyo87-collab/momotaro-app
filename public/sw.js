// リアル桃鉄 サービスワーカー
// - 画像・アイコン：最初に保存しておき、以後は端末から即表示（裏で更新を確認）
// - ビルド済み JS/CSS（/assets/ 配下。ファイル名に版番号入り）：一度取ったら端末から表示
// - HTML：常に最新を取りに行き、圏外のときだけ保存版を表示
// - Firestore など他サイトへの通信：一切触らない
// 画像を差し替えたら CACHE_VERSION を上げること
const CACHE_VERSION = 'v2';
const CACHE_NAME = `momotetsu-${CACHE_VERSION}`;

const PRECACHE = [
  '/home.webp',
  '/bomby-normal.webp',
  '/bomby-petit.webp',
  '/bomby-king.webp',
  '/icons/pwa-192x192.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isImmutableAsset = (url) => url.pathname.startsWith('/assets/');
const isStaticFile = (url) =>
  /\.(webp|png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname) || url.pathname === '/manifest.json';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firestore などは素通し

  // HTML：ネット優先
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // 版番号入りの JS/CSS：キャッシュ優先
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
      )
    );
    return;
  }

  // 画像など：保存版を即表示し、裏で最新に更新
  if (isStaticFile(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((hit) => {
          const update = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || update;
        })
      )
    );
  }
});

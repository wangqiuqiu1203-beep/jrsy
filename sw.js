// jrsy Service Worker v2 - 页面走网络优先，缓存兜底（避免旧页面残留）
const CACHE = 'jrsy-v2';
const OLD_CACHES = ['jrsy-v1'];

self.addEventListener('install', function (e) {
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return OLD_CACHES.indexOf(k) !== -1; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;
    var url = new URL(e.request.url);
    if (url.origin !== location.origin) return;

    // 页面导航（HTML）：网络优先，失败时用缓存兜底（保证永远最新）
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).then(function (res) {
                if (res && res.status === 200) {
                    var clone = res.clone();
                    caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
                }
                return res;
            }).catch(function () {
                return caches.match(e.request).then(function (r) {
                    return r || caches.match('index.html');
                });
            })
        );
        return;
    }

    // 其他静态资源：缓存优先，网络兜底
    e.respondWith(
        caches.match(e.request).then(function (r) {
            return r || fetch(e.request).then(function (res) {
                if (res && res.status === 200 && res.type === 'basic') {
                    var clone = res.clone();
                    caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
                }
                return res;
            });
        }).catch(function () {
            return caches.match('index.html');
        })
    );
});

// jrsy Service Worker v3 - 页面走网络优先，缓存兜底（避免旧页面残留）
// manifest.json 强制网络优先（保证 PWA 安装时读取到最新 display_override 全屏配置）
const CACHE = 'jrsy-v3';
const OLD_CACHES = ['jrsy-v1', 'jrsy-v2'];
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
    // manifest.json 永远走网络（不缓存），确保 PWA 安装时拿到最新配置
    if (url.pathname.indexOf('manifest.json') !== -1) {
        e.respondWith(fetch(e.request).catch(function () {
            return caches.match(e.request);
        }));
        return;
    }
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

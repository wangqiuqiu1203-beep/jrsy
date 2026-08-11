// jrsy Service Worker - PWA 身份证
const CACHE = 'jrsy-v1';
self.addEventListener('install', function (e) {
    self.skipWaiting();
});
self.addEventListener('activate', function (e) {
    e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;
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

/**
 * @file service worker
 */

var CACHE_VERSION = 'cache-v1';

self.addEventListener('install', function (event) {
    console.log('[sw] Service Worker install...');
    // event.waitUntil(
    //     caches.open(CACHE_VERSION).then(function (cache) {
    //         return cache.addAll([
    //             '/',
    //             '/index.html',
    //             '/style.css',
    //             '/index.js',
    //             '/imgs/more.png',
    //             '/imgs/road.png'
    //         ]);
    //     })
    // );
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    console.log('[sw] Service Worker activate...');
    event.waitUntil(
        Promise.all([
            // 更新客户端
            self.clients.claim(),

            // 清理旧版本
            caches.keys().then(function (cacheList) {
                console.log('[sw] cache-list', cacheList);
                return Promise.all(
                    cacheList.map(function (cacheName) {
                        if (cacheName !== CACHE_VERSION) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', function (event) {
    console.log('[sw] Service Worker fetch...');
    event.respondWith(caches.match(event.request).then(function (response) {
        // caches.match() always resolves
        // but in case of success response will have value
        console.log('[sw] request & response', event.request, response);

        return response || fetch(event.request).then(function (response) {
            // response may be used only once
            // we need to save clone to put one copy in cache
            // and serve second one
            let responseClone = response.clone();

            caches.open(CACHE_VERSION).then(function (cache) {
                // console.log('[sw] cache response', responseClone);
                cache.put(event.request, responseClone);
            });
            return response;
        }).catch(function () {
            return caches.match('/imgs/road.png');
        });
    }));
});

self.addEventListener('message', function (event) {
    console.log('[sw] rcv msg: ', event.data);
    event.source.postMessage('this message is from sw.js');
});

// self.clients.matchAll().then(client => {
//     console.log('client', client);
//     client[0].postMessage('this message is from sw.js clients, to page');
// })

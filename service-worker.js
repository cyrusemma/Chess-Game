const CACHE_NAME = 'master-chess-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/board.css',
    '/css/ui.css',
    '/css/animations.css',
    '/js/chess-engine.js',
    '/js/sound.js',
    '/js/animations.js',
    '/js/profile.js',
    '/js/ai-easy.js',
    '/js/ai-stockfish.js',
    '/js/board.js',
    '/js/game.js',
    '/js/analysis.js',
    '/js/puzzles.js',
    '/js/editor.js',
    '/js/multiplayer-local.js',
    '/js/multiplayer-online.js',
    '/js/main.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

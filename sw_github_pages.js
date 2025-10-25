// OMR Test System v6.15 - GitHub Pages Service Worker
const CACHE_NAME = 'omr-test-v6.15-github-pages';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './sw.js'
];

// Install event - cache essential files
self.addEventListener('install', event => {
    console.log('GitHub Pages PWA: Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('GitHub Pages PWA: Caching files');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('GitHub Pages PWA: Cache failed:', error);
            })
    );
    // Force activation of new service worker
    self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // If both cache and network fail, return offline page
                        if (event.request.destination === 'document') {
                            return caches.match('./');
                        }
                    });
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('GitHub Pages PWA: Activating service worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('GitHub Pages PWA: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure the new service worker takes control immediately
    self.clients.claim();
});

// Handle messages from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('GitHub Pages PWA: Background sync triggered');
        // Handle background sync here if needed
    }
});

// Push notification handling
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Open App',
                    icon: './icon-192.png'
                },
                {
                    action: 'close',
                    title: 'Close',
                    icon: './icon-192.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// GitHub Pages specific optimizations
console.log('GitHub Pages PWA Service Worker loaded');
console.log('Cache name:', CACHE_NAME);
console.log('Caching strategy: Cache-first for static, network-first for dynamic');
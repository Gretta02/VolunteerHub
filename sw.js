// Service Worker for VolunteerHub - Performance & Offline Support

const CACHE_NAME = 'volunteerhub-v1.0.0';
const STATIC_CACHE = 'volunteerhub-static-v1';
const DYNAMIC_CACHE = 'volunteerhub-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/volunteerHub/',
    '/volunteerHub/index.html',
    '/volunteerHub/pages/events.html',
    '/volunteerHub/pages/about.html',
    '/volunteerHub/pages/contact.html',
    '/volunteerHub/styles/main.css',
    '/volunteerHub/styles/dashboard.css',
    '/volunteerHub/js/main.js',
    '/volunteerHub/js/auth.js',
    '/volunteerHub/js/auth-secure.js',
    '/volunteerHub/js/performance.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// API endpoints to cache with strategy
const API_CACHE_STRATEGY = {
    '/volunteerHub/api/events.php': 'stale-while-revalidate',
    '/volunteerHub/api/users.php': 'network-first',
    '/volunteerHub/api/messages.php': 'network-first'
};

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (url.pathname.startsWith('/volunteerHub/api/')) {
        event.respondWith(handleAPIRequest(request));
    } else if (url.pathname.includes('.')) {
        event.respondWith(handleStaticAsset(request));
    } else {
        event.respondWith(handlePageRequest(request));
    }
});

// API request handler with caching strategies
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    const strategy = API_CACHE_STRATEGY[url.pathname] || 'network-first';
    
    switch (strategy) {
        case 'stale-while-revalidate':
            return staleWhileRevalidate(request);
        case 'network-first':
            return networkFirst(request);
        case 'cache-first':
            return cacheFirst(request);
        default:
            return fetch(request);
    }
}

// Static asset handler
async function handleStaticAsset(request) {
    return cacheFirst(request);
}

// Page request handler
async function handlePageRequest(request) {
    return networkFirst(request, '/volunteerHub/index.html');
}

// Caching strategies
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const networkResponsePromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cachedResponse);
    
    return cachedResponse || networkResponsePromise;
}

async function networkFirst(request, fallbackUrl = null) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        if (fallbackUrl) {
            const fallbackResponse = await cache.match(fallbackUrl);
            if (fallbackResponse) {
                return fallbackResponse;
            }
        }
        
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Failed to fetch resource:', error);
        
        return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case 'event-registration':
            event.waitUntil(syncEventRegistrations());
            break;
        case 'message-send':
            event.waitUntil(syncMessages());
            break;
        case 'contact-form':
            event.waitUntil(syncContactForms());
            break;
    }
});

// Sync functions for offline actions
async function syncEventRegistrations() {
    try {
        const registrations = await getStoredData('pending-registrations');
        
        for (const registration of registrations) {
            try {
                const response = await fetch('/volunteerHub/api/events.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registration)
                });
                
                if (response.ok) {
                    await removeStoredData('pending-registrations', registration.id);
                }
            } catch (error) {
                console.error('Failed to sync registration:', error);
            }
        }
    } catch (error) {
        console.error('Sync registrations failed:', error);
    }
}

async function syncMessages() {
    try {
        const messages = await getStoredData('pending-messages');
        
        for (const message of messages) {
            try {
                const response = await fetch('/volunteerHub/api/messages.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });
                
                if (response.ok) {
                    await removeStoredData('pending-messages', message.id);
                }
            } catch (error) {
                console.error('Failed to sync message:', error);
            }
        }
    } catch (error) {
        console.error('Sync messages failed:', error);
    }
}

async function syncContactForms() {
    try {
        const forms = await getStoredData('pending-contact-forms');
        
        for (const form of forms) {
            try {
                const response = await fetch('/volunteerHub/api/contact.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
                
                if (response.ok) {
                    await removeStoredData('pending-contact-forms', form.id);
                }
            } catch (error) {
                console.error('Failed to sync contact form:', error);
            }
        }
    } catch (error) {
        console.error('Sync contact forms failed:', error);
    }
}

// IndexedDB helpers for offline storage
async function getStoredData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('VolunteerHubDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result || []);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function removeStoredData(storeName, id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('VolunteerHubDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => {
                resolve();
            };
            
            deleteRequest.onerror = () => {
                reject(deleteRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Push notification handler
self.addEventListener('push', event => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from VolunteerHub',
        icon: '/volunteerHub/images/icon-192.png',
        badge: '/volunteerHub/images/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details',
                icon: '/volunteerHub/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/volunteerHub/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('VolunteerHub', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/volunteerHub/pages/events.html')
        );
    }
});

console.log('Service Worker loaded successfully');
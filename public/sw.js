// Enhanced Service Worker for PWA
const CACHE_NAME = 'center-management-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'
const API_CACHE = 'api-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon512_maskable.png',
  '/icon512_rounded.png'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First strategy
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/') || 
             url.pathname.startsWith('/static/')) {
    // Static assets - Cache First strategy
    event.respondWith(handleStaticRequest(request))
  } else if (url.pathname.startsWith('/') && 
             !url.pathname.includes('.')) {
    // Page requests - Network First with offline fallback
    event.respondWith(handlePageRequest(request))
  } else {
    // Other requests - Network First
    event.respondWith(handleOtherRequest(request))
  }
})

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for API request')
    
    // Fall back to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request requires an internet connection' 
      }),
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static assets with Cache First strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fall back to network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Error fetching static asset', error)
    throw error
  }
}

// Handle page requests with Network First strategy
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for page request')
    
    // Fall back to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fall back to offline page
    const offlineResponse = await cache.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Last resort - return basic offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Center Management</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>You are offline</h1>
          <p>Please check your internet connection and try again.</p>
        </body>
      </html>
      `,
      { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Handle other requests with Network First strategy
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed for other request')
    throw error
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Get pending operations from IndexedDB
    const pendingOps = await getPendingOperations()
    
    for (const operation of pendingOps) {
      try {
        await syncOperation(operation)
        await markOperationAsSynced(operation.id)
      } catch (error) {
        console.error('Service Worker: Error syncing operation', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'default',
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.notification.tag)
  
  event.notification.close()
  
  const action = event.action
  const notificationData = event.notification.data
  
  // Handle different notification actions
  if (action === 'view' || !action) {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (action === 'update') {
    // Update action - reload the app
    event.waitUntil(
      clients.openWindow('/').then(() => {
        // Send message to update the app
        return clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'app-update' })
          })
        })
      })
    )
  }
  
  // Send message to main thread about notification click
  event.waitUntil(
    clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'notification-click',
          action,
          notificationData
        })
      })
    })
  )
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CACHE_URLS':
      cacheUrls(data.urls)
      break
    case 'CLEAR_CACHE':
      clearCache(data.cacheName)
      break
    default:
      console.log('Service Worker: Unknown message type', type)
  }
})

// Helper functions
async function getPendingOperations() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return []
}

async function syncOperation(operation) {
  // This would sync the operation with the server
  console.log('Service Worker: Syncing operation', operation)
}

async function markOperationAsSynced(operationId) {
  // This would mark the operation as synced in IndexedDB
  console.log('Service Worker: Marking operation as synced', operationId)
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE)
  return cache.addAll(urls)
}

async function clearCache(cacheName) {
  return caches.delete(cacheName)
}

// Periodic background sync (if supported)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag)
    
    if (event.tag === 'content-sync') {
      event.waitUntil(doBackgroundSync())
    }
  })
}
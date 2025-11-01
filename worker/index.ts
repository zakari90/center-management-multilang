/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Simple, reliable service worker - cache pages as you visit them
import { clientsClaim, skipWaiting } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Disable dev logs
self.__WB_DISABLE_DEV_LOGS = true;

// Skip waiting and claim clients immediately
skipWaiting();
clientsClaim();

// Precache manifest (essential files from next-pwa)
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// ============================================
// BASIC CACHING STRATEGY: Cache As You Browse
// ============================================

// 1. STATIC ASSETS - Cache First (they don't change)
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// 2. _next/static files - Cache First (build assets)
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/static/'),
  new CacheFirst({
    cacheName: 'next-static-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// 3. API CALLS - Network First with fast fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 2, // Fast timeout
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// 4. ALL PAGES - Network First, fallback to cache (cache as you browse)
registerRoute(
  ({ request }) => request.mode === 'navigate' || request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages-v1',
    networkTimeoutSeconds: 1, // Very fast timeout for offline
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 5. GLOBAL CATCH HANDLER - Fallback to offline page
setCatchHandler(async ({ event }: any) => {
  const { request } = event;

  // For navigation requests, try cache first, then offline page
  if (request.mode === 'navigate' || request.destination === 'document') {
    // Try to find any cached version
    const cache = await caches.open('pages-v1');
    const cachedResponse = await cache.match(request, {
      ignoreSearch: true,
      ignoreMethod: true,
      ignoreVary: true,
    });

    if (cachedResponse) {
      return cachedResponse;
    }

    // Try other caches
    const allCaches = await caches.keys();
    for (const cacheName of allCaches) {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request, {
        ignoreSearch: true,
        ignoreMethod: true,
        ignoreVary: true,
      });
      if (cached) {
        return cached;
      }
    }

    // Last resort: offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Final fallback: simple HTML
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔌 You're Offline</h1>
    <p>This page wasn't cached yet.<br>Please visit it while online first, then it will work offline.</p>
    <button onclick="window.history.back()" style="padding: 0.75rem 2rem; margin-top: 1rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">Go Back</button>
  </div>
</body>
</html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // For other requests, return error
  return Response.error();
});

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    clientsClaim();
  }
});

console.log('[SW] Simple service worker loaded - caching pages as you visit them');

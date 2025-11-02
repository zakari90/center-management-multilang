/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Serwist service worker - Cache all pages including locale routes
import { Serwist, CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";

declare const self: ServiceWorkerGlobalScope;

// Serwist/Next.js injects the manifest
declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST?: Array<{ url: string; revision: string | null }>;
    __WB_MANIFEST?: Array<{ url: string; revision: string | null }>;
  }
}

// Get manifest from either __SW_MANIFEST or __WB_MANIFEST
const manifest = (self.__SW_MANIFEST || self.__WB_MANIFEST || []) as Array<{ url: string; revision: string | null }>;

console.log("[SW] Manifest entries:", manifest.length);

// Create Serwist instance
const serwist = new Serwist({
  precacheEntries: manifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Static assets - Cache First
    {
      matcher: ({ request }: { request: Request }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "font" ||
        request.destination === "image",
      handler: new CacheFirst({
        cacheName: "static-assets-v1",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          }),
        ],
      }),
    },
    // Next.js static files
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static-v1",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // API calls - Network First
    {
      matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-cache-v1",
        networkTimeoutSeconds: 2,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 5 * 60, // 5 minutes
          }),
        ],
      }),
    },
    // ALL PAGES - Network First (including locale routes like /en/manager, /ar/admin, etc.)
    // This is the most important rule - it caches ALL navigation requests
    {
      matcher: ({ request, url }: { request: Request; url: URL }) => {
        // Match navigation requests OR document requests
        const isNavigation = request.mode === "navigate";
        const isDocument = request.destination === "document";
        
        // Exclude API routes, Next.js internals, and service worker
        const excluded = url.pathname.startsWith("/api/") ||
                        url.pathname.startsWith("/_next/") ||
                        url.pathname.startsWith("/sw.js") ||
                        url.pathname.includes("/worker/");
        
        return (isNavigation || isDocument) && !excluded;
      },
      handler: new NetworkFirst({
        cacheName: "pages-v1",
        networkTimeoutSeconds: 1, // Fast timeout for offline
        plugins: [
          new ExpirationPlugin({
            maxEntries: 500, // Increased to cache more pages
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
  ],
});

// Register Serwist event listeners
serwist.addEventListeners();

// Handle service worker messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install event - cache offline page
self.addEventListener("install", (event: any) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      // Precache offline page
      caches.open("pages-v1").then((cache) => {
        return cache.add("/offline.html").catch((err) => {
          console.warn("[SW] Failed to cache offline.html:", err);
        });
      }),
    ])
  );
});

// Activate event
self.addEventListener("activate", (event: any) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(self.clients.claim());
});

// Additional fetch handler to ensure ALL pages are cached
// This works alongside Serwist's runtime caching
self.addEventListener("fetch", (event: any) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip API, Next.js internals, service worker, and non-HTML
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/sw.js") ||
    url.pathname.includes("/worker/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    return; // Let Serwist handle these
  }
  
  // Handle navigation and document requests (pages)
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      (async () => {
        const cache = await caches.open("pages-v1");
        
        try {
          // Try network first (with timeout)
          const networkPromise = fetch(request);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Network timeout")), 1000)
          );
          
          const networkResponse = await Promise.race([networkPromise, timeoutPromise]) as Response;
          
          // If successful, cache it for offline
          if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone()).catch((err) => {
              console.warn("[SW] Failed to cache page:", err);
            });
            return networkResponse;
          }
          
          throw new Error("Network response not ok");
        } catch {
          console.log("[SW] Network failed for:", url.pathname, "- checking cache...");
          
          // Try exact match first
          let cachedResponse = await cache.match(request.url, {
            ignoreSearch: true,
            ignoreMethod: true,
            ignoreVary: true,
          });
          
          if (cachedResponse) {
            console.log("[SW] ✓ Serving from cache:", url.pathname);
            return cachedResponse;
          }
          
          // Try matching by pathname (ignore query params)
          cachedResponse = await cache.match(url.pathname, {
            ignoreSearch: true,
            ignoreMethod: true,
            ignoreVary: true,
          });
          
          if (cachedResponse) {
            console.log("[SW] ✓ Serving cached page (by path):", url.pathname);
            return cachedResponse;
          }
          
          // Try matching any page in same locale
          const pathParts = url.pathname.split("/");
          if (pathParts.length >= 2) {
            const locale = pathParts[1]; // e.g., "en", "ar", "fr"
            const allCached = await cache.keys();
            const localeMatch = allCached.find((req) => {
              const reqUrl = new URL(req.url);
              return reqUrl.pathname.startsWith(`/${locale}/`);
            });
            
            if (localeMatch) {
              const localeCached = await cache.match(localeMatch);
              if (localeCached) {
                console.log("[SW] ✓ Serving cached locale page");
                return localeCached;
              }
            }
          }
          
          // Last resort: offline page
          const offlinePage = await cache.match("/offline.html");
          if (offlinePage) {
            console.log("[SW] → Serving offline page");
            return offlinePage;
          }
          
          // Final fallback
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
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
    button {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      background: white;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div>
    <h1>🔌 You're Offline</h1>
    <p>This page wasn't cached yet.<br>Please visit it while online first, then it will work offline.</p>
    <button onclick="window.history.back()">Go Back</button>
  </div>
</body>
</html>`,
            {
              headers: { "Content-Type": "text/html" },
            }
          );
        }
      })()
    );
  }
});

console.log("[SW] Serwist service worker loaded - caching all pages as you visit them");

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
    }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    disableDevLogs: true,
    precacheOptions: {
        cleanupOutdatedCaches: true,
        ignoreURLParametersMatching: [/.*/],
    },
    fallbacks: {
      entries: [
        {
          url: "/offlinedoc",
          matcher({ request }) {
            const url = new URL(request.url);
            return request.destination === "document" && url.pathname.startsWith("/doc");
          },
        },
 
        {
          url: "/offline",
          matcher({ request }) {
           
            return request.destination === "document";
          },
        },
      ],
    },
    
    runtimeCaching: defaultCache,
})

const urlsToCache = ["/",] as const

self.addEventListener("install", (event) => {
    event.waitUntil(
        Promise.all(
            urlsToCache.map((entry) => {
                const request = serwist.handleRequest({
                    request: new Request(entry),
                    event,
                })
                return request
            }),
        ),
    )
})

serwist.addEventListeners()
// import { defaultCache } from "@serwist/next/worker";
// import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
// import { Serwist } from "serwist";

// // Types for global config and manifest injection (for Serwist/Next.js)
// declare global {
//   interface WorkerGlobalScope extends SerwistGlobalConfig {
//     __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
//   }
// }

// declare const self: ServiceWorkerGlobalScope;

// // ---- SERWIST CONFIG ----

// const serwist = new Serwist({
//   // Only precache entries from the build manifest (which have revision info)
//   // Dynamic routes like /en/, /fr/, /ar/ are handled by runtime caching
//   // NOTE: We intentionally disable build precaching because a single 404 in
//   // the precache manifest will fail SW install with "bad-precaching-response".
//   // We rely on runtime caching + our manual pages cache (pages-v1) instead.
//   precacheEntries: [],
//   skipWaiting: true,
//   clientsClaim: true,
//   navigationPreload: true,
//   disableDevLogs: true,
//   precacheOptions: {
//     cleanupOutdatedCaches: true,
//     ignoreURLParametersMatching: [/.*/], // Ignore URL query for cached files
//   },
//   runtimeCaching: defaultCache, // Next.js dynamic/runtime caching handles all routes
// });

// const PAGES_CACHE = 'pages-v1';

// self.addEventListener('message', (event) => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     console.log('[SW] received SKIP_WAITING')
//     self.skipWaiting();
//   }
// });

// self.addEventListener('fetch', (event) => {
//   const { request } = event;
//   if (request.method !== 'GET') return;
//   if (request.mode !== 'navigate') return;

//   event.respondWith(
//     (async () => {
//       try {
//         const url = new URL(request.url);
//         console.log('[SW] navigate fetch', { pathname: url.pathname });
//         const preload = await event.preloadResponse;
//         if (preload) {
//           console.log('[SW] using navigation preload', { pathname: url.pathname });
//           return preload;
//         }
//         const networkResponse = await fetch(request);
//         console.log('[SW] network ok', { pathname: url.pathname, status: networkResponse.status });
//         return networkResponse;
//       } catch {
//         const url = new URL(request.url);
//         const cache = await caches.open(PAGES_CACHE);
//         const cached = await cache.match(url.pathname);
//         if (cached) {
//           console.log('[SW] offline cache hit', { pathname: url.pathname });
//           return cached;
//         }
//         console.log('[SW] offline cache miss', { pathname: url.pathname });
//         return new Response('Offline', {
//           status: 503,
//           headers: { 'Content-Type': 'text/plain; charset=utf-8' },
//         });
//       }
//     })(),
//   );
// });

// // ---- CORE SW LISTENERS ----

// serwist.addEventListeners();
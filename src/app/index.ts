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

const urlsToCache = ["/","/offlinedoc", "/~offline"] as const

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

// // ---- STATIC ROUTE DEFINITIONS ----

// // Locales supported
// const locales = ["en", "fr", "ar"] as const;

// // All STATIC page route fragments (NO dynamic segments like [id])
// const STATIC_PAGES = [
//   "/*",
//   // Shell
//   "/",
//   // Auth
//   "/login",
//   "/loginmanager", //this a url or 
//   "/register",
//   "/(auth)/login",
//   "/(auth)/loginmanager", //this a url or 
//   "/(auth)/register",
//   // Admin
//   "/admin",
//   "/admin/center",
//   "/admin/receipts",
//   "/admin/schedule",
//   "/admin/users",
//   // Manager
//   "/manager",
//   "/manager/receipts",
//   "/manager/receipts/create",
//   "/manager/receipts/create-teacher-payment",
//   "/manager/schedule",
//   "/manager/students",
//   "/manager/students/create",
//   "/manager/teachers",
//   "/manager/teachers/create",
// ];

// // Generate all static localized routes (no dynamic ones)
// const STATIC_ROUTES = locales.flatMap(locale =>
//   STATIC_PAGES.map(page => `/${locale}${page || ""}`)
// );

// // ---- SERWIST CONFIG ----

// const serwist = new Serwist({
//   precacheEntries: [...self.__SW_MANIFEST ?? [], ...STATIC_ROUTES], // merge code and manifest entries
//   skipWaiting: true,
//   clientsClaim: true,
//   navigationPreload: true,
//   disableDevLogs: true,
//   precacheOptions: {
//     cleanupOutdatedCaches: true,
//     ignoreURLParametersMatching: [/.*/], // Ignore URL query for cached files
//   },
//   runtimeCaching: defaultCache, // Next.js dynamic/runtime caching
// });

// // ---- INSTALL EVENT (MANUAL PRECACHE, OPTIONAL) ----

// self.addEventListener("install", event => {
//   event.waitUntil(
//     Promise.all(
//       STATIC_ROUTES.map(route =>
//         serwist.handleRequest({
//           request: new Request(route),
//           event,
//         })
//       )
//     )
//   );
// });

// // ---- CORE SW LISTENERS ----

// serwist.addEventListeners();

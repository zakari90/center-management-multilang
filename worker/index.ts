/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Serwist service worker - Simple cache-as-you-browse strategy
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: any;
  }
}

// Create Serwist instance
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "font" ||
        request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets-v1",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/_next/static/"),
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-v1",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache-v1",
        networkTimeoutSeconds: 2,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.mode === "navigate" || request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-v1",
        networkTimeoutSeconds: 1,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true,
        },
        fallbackOnError: true,
      },
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

console.log("[SW] Serwist service worker loaded - caching pages as you visit them");

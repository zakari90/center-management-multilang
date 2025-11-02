/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Serwist service worker - Simple cache-as-you-browse strategy
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
    {
      matcher: ({ request }: { request: Request }) =>
        request.mode === "navigate" || request.destination === "document",
      handler: new NetworkFirst({
        cacheName: "pages-v1",
        networkTimeoutSeconds: 1,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
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

// Install event
self.addEventListener("install", (event: any) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener("activate", (event: any) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(self.clients.claim());
});

console.log("[SW] Serwist service worker loaded - caching pages as you visit them");

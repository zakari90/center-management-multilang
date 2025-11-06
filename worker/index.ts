import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Types for global config and manifest injection (for Serwist/Next.js)
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ---- STATIC ROUTE DEFINITIONS ----

// Locales supported
const locales = ["en", "fr", "ar"] as const;

// All STATIC page route fragments (NO dynamic segments like [id])
// Note: Route groups like (auth) are NOT part of the URL - they're just for organization
// Only include actual URL paths that exist
const STATIC_PAGES = [
  // Shell
  "/",
  // Auth (these are the actual URLs, not the route group paths)
  "/login",
  "/loginmanager",
  "/register",
  // Admin
  "/admin",
  "/admin/center",
  "/admin/receipts",
  "/admin/schedule",
  "/admin/users",
  // Manager
  "/manager",
  "/manager/receipts",
  "/manager/receipts/create",
  "/manager/receipts/create-teacher-payment",
  "/manager/schedule",
  "/manager/students",
  "/manager/students/create",
  "/manager/teachers",
  "/manager/teachers/create",
];

// Generate all static localized routes with revision info
// Using PrecacheEntry format to avoid "no revision info" warnings
// For dynamic Next.js pages, we use a version string as revision
const BUILD_VERSION = "1.0.0"; // Update this on each deployment to bust cache
const STATIC_ROUTES: PrecacheEntry[] = locales.flatMap(locale =>
  STATIC_PAGES.map(page => {
    const url = `/${locale}${page || ""}`;
    return {
      url,
      revision: BUILD_VERSION, // Version string for cache invalidation
    };
  })
);

// ---- SERWIST CONFIG ----

const serwist = new Serwist({
  precacheEntries: [...self.__SW_MANIFEST ?? [], ...STATIC_ROUTES], // merge code and manifest entries
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/.*/], // Ignore URL query for cached files
  },
  runtimeCaching: defaultCache, // Next.js dynamic/runtime caching
});

// ---- INSTALL EVENT (MANUAL PRECACHE, OPTIONAL) ----

self.addEventListener("install", event => {
  event.waitUntil(
    Promise.all(
      STATIC_ROUTES.map(route =>
        serwist.handleRequest({
          request: new Request(route.url),
          event,
        })
      )
    )
  );
});

// ---- CORE SW LISTENERS ----

serwist.addEventListeners();

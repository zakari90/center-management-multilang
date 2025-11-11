import { defaultCache } from "@serwist/next/worker";
import type { SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Types for global config and manifest injection (for Serwist/Next.js)
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (string | { url: string; revision: string })[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ---- STATIC ROUTE DEFINITIONS ----
// No static routes are precached to ensure all pages are fresh
// This is especially important for:
// - Auth pages (login, register) - should always be fresh
// - Protected routes (admin, manager) - require authentication
// - Dynamic content - changes based on user data
// All routes are handled by runtime caching strategies

// ---- SERWIST CONFIG ----

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [], // Only precache build assets (JS, CSS, etc.)
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

// ---- INSTALL EVENT ----
// No manual precaching needed - all routes are handled dynamically
// This ensures auth pages and protected routes are always fresh

// ---- CORE SW LISTENERS ----

serwist.addEventListeners();

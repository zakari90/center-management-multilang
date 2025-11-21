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

// ---- SERWIST CONFIG ----

const serwist = new Serwist({
  // Only precache entries from the build manifest (which have revision info)
  // Dynamic routes like /en/, /fr/, /ar/ are handled by runtime caching
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/.*/], // Ignore URL query for cached files
  },
  runtimeCaching: defaultCache, // Next.js dynamic/runtime caching handles all routes
});

// ---- CORE SW LISTENERS ----

serwist.addEventListeners();
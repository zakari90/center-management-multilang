import { create } from "zustand";
import { PAGES_CACHE_NAME, BASE_PAGES } from "@/lib/pwa-constants";

export interface CacheStatusState {
  pageStatuses: Record<string, boolean>; // { "/en/manager/students": true }
  allCached: boolean;
  isInitialCheckDone: boolean;
  checkAllPages: (locale: string) => Promise<void>;
  updatePageStatus: (url: string, isCached: boolean) => void;
}

export const useCacheStatusStore = create<CacheStatusState>((set, get) => ({
  pageStatuses: {},
  allCached: false,
  isInitialCheckDone: false,

  updatePageStatus: (url: string, isCached: boolean) => {
    const newStatuses = { ...get().pageStatuses, [url]: isCached };
    set({
      pageStatuses: newStatuses,
      allCached: Object.values(newStatuses).every(Boolean) && 
                 Object.keys(newStatuses).length >= BASE_PAGES.length
    });
  },

  checkAllPages: async (locale: string) => {
    if (typeof window === "undefined" || !("caches" in window)) return;

    try {
      const cache = await caches.open(PAGES_CACHE_NAME);
      const newStatuses: Record<string, boolean> = {};
      const origin = window.location.origin;

      // Construct the list of URLs to check.
      // We check both the localized versions AND the root shell if present.
      const pagesToCheck: string[] = [];
      BASE_PAGES.forEach((p) => {
        if (p === "/") {
          pagesToCheck.push("/"); // Root shell
        }
        pagesToCheck.push(`/${locale}${p === "/" ? "" : p}`); // Localized page
      });
      
      const results = await Promise.all(
        pagesToCheck.map(async (pagePath) => {
          // The SW stores pages with a __sw_locale query param as the cache key,
          // e.g. "http://localhost:3000/ar/admin?__sw_locale=ar"
          const cacheKeyUrl = `${origin}${pagePath}?__sw_locale=${encodeURIComponent(locale)}`;
          const cacheKey = new Request(cacheKeyUrl, { method: "GET" });
          const match = await cache.match(cacheKey);
          const isCached = !!match;
          newStatuses[pagePath] = isCached;
          return isCached;
        })
      );

      set({
        pageStatuses: newStatuses,
        allCached: results.every(Boolean),
        isInitialCheckDone: true
      });
    } catch (error) {
      console.error("Error checking cache store:", error);
    }
  },
}));

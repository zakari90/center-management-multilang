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
      allCached:
        Object.values(newStatuses).every(Boolean) &&
        Object.keys(newStatuses).length >= BASE_PAGES.length,
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
      const pathname = window.location.pathname;
      const isAdmin = pathname.includes("/pro/admin");
      const isManager = pathname.includes("/pro/manager");
      const isFree = pathname.includes("/free");
      const isSchedule = pathname.includes("/schedule") && !pathname.includes("/pro") && !pathname.includes("/free");

      const pagesToCheck: string[] = [];
      BASE_PAGES.forEach((p) => {
        // Filter out routes that are inaccessible/irrelevant based on current role
        // This prevents the indicator from spinning forever due to 403s on protected routes
        if (isAdmin && p.startsWith("/pro/manager")) return;
        if (isManager && p.startsWith("/pro/admin")) return;
        if (isFree && p.startsWith("/pro")) return;
        if (!isFree && p.startsWith("/free")) return;
        // On the schedule page, only check schedule-relevant pages
        if (isSchedule && p.startsWith("/pro")) return;
        if (isSchedule && p.startsWith("/free")) return;


        if (p === "/") {
          pagesToCheck.push("/"); // Root shell
        }
        pagesToCheck.push(`/${locale}${p === "/" ? "" : p}`); // Localized page
      });

      const results = await Promise.all(
        pagesToCheck.map(async (pagePath) => {
          // Normalize path to avoid double slashes
          const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
          const fullUrl = `${origin}${normalizedPath}`;
          
          // 1. Try with locale query param (set by SW fetch)
          const cacheKeyUrl = `${fullUrl}?__sw_locale=${encodeURIComponent(locale)}`;
          const cacheKey = new Request(cacheKeyUrl, { method: "GET" });
          let match = await cache.match(cacheKey);
          
          // 2. Try plain URL (set by SW install/pre-cache)
          if (!match) {
            match = await cache.match(fullUrl);
          }
          
          // 3. Try with/without trailing slash fallback
          if (!match) {
            const alternativeUrl = fullUrl.endsWith("/") ? fullUrl.slice(0, -1) : `${fullUrl}/`;
            match = await cache.match(alternativeUrl);
          }
          
          // 4. Last resort: relative match
          if (!match) {
            match = await cache.match(normalizedPath);
          }

          const isCached = !!match;
          if (!isCached) {
            console.debug(`[CacheStatus] Not yet cached: ${normalizedPath}`);
          }

          
          newStatuses[pagePath] = isCached;
          return isCached;
        }),
      );

      set({
        pageStatuses: newStatuses,
        allCached: results.every(Boolean),
        isInitialCheckDone: true,
      });
    } catch (error) {
      console.error("Error checking cache store:", error);
    }
  },
}));

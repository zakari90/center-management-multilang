import { create } from "zustand";
import { PAGES_CACHE_NAME } from "@/lib/pwa-constants";

// The same list used by page-precache-handler
const BASE_PAGES = [
  "/",
  "/login",
  "/loginmanager",
  "/register",
  "/admin",
  "/admin/center",
  "/admin/receipts",
  "/admin/schedule",
  "/admin/users",
  "/admin/test",
  "/manager",
  "/manager/receipts",
  "/manager/schedule",
  "/manager/students",
  "/manager/teachers",
];

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

      const localizedPages = BASE_PAGES.map((p) => `/${locale}${p === "/" ? "" : p}`);
      
      const results = await Promise.all(
        localizedPages.map(async (url) => {
          const match = await cache.match(url);
          const isCached = !!match;
          newStatuses[url] = isCached;
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

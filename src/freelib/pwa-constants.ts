export const SW_VERSION = "v1.2.0";
export const PAGES_CACHE_NAME = `pages-${SW_VERSION}`;
export const ASSETS_CACHE_NAME = `assets-${SW_VERSION}`;

/** Single source of truth for all pages to precache / track */
export const BASE_PAGES = [
  // Home
  "/",

  // Auth pages
  "/login",

  // Admin pages
  "/admin",
  "/admin/center",
  "/admin/receipts",
  "/admin/schedule",
  "/admin/users",
  "/admin/test",
] as const;


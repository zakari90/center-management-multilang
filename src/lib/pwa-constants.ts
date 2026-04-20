export const SW_VERSION = "v1.2.0";
export const PAGES_CACHE_NAME = `pages-${SW_VERSION}`;
export const ASSETS_CACHE_NAME = `assets-${SW_VERSION}`;

/** Single source of truth for all pages to precache / track */
export const BASE_PAGES = [
  // Home
  "/",

  // Auth pages
  "/pro/login",

  // Admin pages
  "/pro/admin",
  "/pro/admin/center",
  "/pro/admin/receipts",
  "/pro/admin/schedule",
  "/pro/admin/users",
  "/pro/admin/database",

  // Manager pages
  "/pro/manager",
  "/pro/manager/teachers",
  "/pro/manager/students",
  "/pro/manager/receipts",
  "/pro/manager/schedule",

  // Public / Schedule pages
  "/schedule",
  "/schedule/attendance",

  // Free Mode pages
  "/free",
  "/free/login",
  "/free/admin",
  "/free/admin/center",
  "/free/admin/receipts",
  "/free/admin/schedule",
  "/free/admin/users",
  "/free/admin/database",
] as const;

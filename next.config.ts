/* eslint-disable @typescript-eslint/no-explicit-any */
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

// Generate precache entries for essential pages (precached on install for fast access)
function generatePrecacheEntries() {
  const locales = ['en', 'ar', 'fr'];
  
  // Essential pages that should be available immediately after install
  const essentialRoutes = [
    '', // Home page
    'login',
    'loginmanager',
    'register',
    'admin',
    'manager',
  ];
  
  // Important pages that should be cached but not critical for first install
  const importantRoutes = [
    'admin/center',
    'admin/users',
    'manager/students',
    'manager/teachers',
    'manager/receipts',
  ];

  const entries: Array<{ url: string; revision: null }> = [];

  // Add offline page first (critical)
  entries.push({
    url: '/offline.html',
    revision: null,
  });

  // Add essential routes for all locales
  locales.forEach(locale => {
    essentialRoutes.forEach(route => {
      entries.push({
        url: route ? `/${locale}/${route}` : `/${locale}`,
        revision: null,
      });
    });
    
    // Add important routes
    importantRoutes.forEach(route => {
      entries.push({
        url: `/${locale}/${route}`,
        revision: null,
      });
    });
  });

  return entries;
}

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  register: true,
  customWorkerDir: "worker",
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true, // Changed to true for faster activation
    clientsClaim: true,
    additionalManifestEntries: generatePrecacheEntries(),
    // Note: Runtime caching is now handled in custom worker (worker/index.ts)
    // for better control over caching strategies
    runtimeCaching: [
      {
        urlPattern: /^\/(_next\/static|static)\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60,
          },
        },
      },
      {
        urlPattern: /^\/(en|ar|fr)\/(manager|admin)\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'dynamic-pages',
          networkTimeoutSeconds: 1, // Faster offline response
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /^\/(en|ar|fr)\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 1, // Faster offline response
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
    navigateFallback: '/offline.html',
    navigateFallbackDenylist: [/^\/_next\//, /^\/api\//],
  },
} as any); // Type assertion to bypass TypeScript error

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(withNextIntl(nextConfig));

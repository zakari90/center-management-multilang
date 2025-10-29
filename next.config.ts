/* eslint-disable @typescript-eslint/no-explicit-any */
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

// Generate precache entries for all routes
function generatePrecacheEntries() {
  const locales = ['en', 'ar', 'fr'];
  const routes = [
    // Auth routes
    'login',
    'loginmanager',
    'register',
    
    // Admin routes
    'admin/center',
    'admin/receipts',
    'admin/schedule',
    'admin/users',
    
    // Manager routes
    'manager/receipts',
    'manager/receipts/create',
    'manager/receipts/create-teacher-payment',
    'manager/schedule',
    'manager/students',
    'manager/students/create',
    'manager/teachers',
    'manager/teachers/create',
  ];

  const entries: Array<{ url: string; revision: null }> = [];

  locales.forEach(locale => {
    routes.forEach(route => {
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
  swcMinify: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
    additionalManifestEntries: generatePrecacheEntries(),
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
        // Cache dynamic routes (e.g., /manager/students/[id])
        urlPattern: /^\/(en|ar|fr)\/(manager|admin)\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'dynamic-pages',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  } as any,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(withNextIntl(nextConfig));

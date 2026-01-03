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
  // IMPORTANT: Disable build precaching. A single 404 entry causes SW install to fail
  // with "bad-precaching-response", which means offline refresh won't be controlled.
  precacheEntries: [],
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

const PAGES_CACHE = 'pages-v1';
const ASSETS_CACHE = 'assets-v1';

function getPrimaryAcceptLanguage(header: string | null): string {
  if (!header) return 'ar';
  const first = header.split(',')[0]?.trim();
  if (!first) return 'ar';
  return first.split(';')[0]?.trim() || 'ar';
}

async function matchAnyLocalePage(cache: Cache, origin: string, pathname: string): Promise<Response | undefined> {
  // Fallback: when localePrefix is "never", locale selection may not be reliably
  // detectable in the SW on a hard refresh. If we have *any* cached HTML variant
  // for this pathname, return it.
  const keys = await cache.keys();
  const prefix = `${origin}${pathname}?__sw_locale=`;
  for (const req of keys) {
    if (req.url.startsWith(prefix)) {
      const res = await cache.match(req);
      if (res) return res;
    }
  }
  return undefined;
}

async function matchAppShell(cache: Cache, origin: string): Promise<Response | undefined> {
  // As a last resort, serve a cached "app shell" so offline refresh doesn't crash.
  // This requires the user to have visited / at least once online.
  const shell = await matchAnyLocalePage(cache, origin, '/');
  if (shell) return shell;

  // Backward compatibility: if something cached '/' without the locale query.
  const plain = await cache.match('/');
  if (plain) return plain;

  return undefined;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] received SKIP_WAITING')
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Automatically cache Next.js static assets (JS/CSS/fonts/etc) so the app can hydrate offline.
  // We keep this independent from Serwist precache to avoid install failures.
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS_CACHE);
        const cached = await cache.match(url.pathname);
        if (cached) {
          // Revalidate in background
          event.waitUntil(
            fetch(request)
              .then((res) => {
                if (res.ok) return cache.put(url.pathname, res.clone());
              })
              .catch(() => {}),
          );
          return cached;
        }
        try {
          const res = await fetch(request);
          if (res.ok) await cache.put(url.pathname, res.clone());
          return res;
        } catch {
          return new Response('', { status: 504 });
        }
      })(),
    );
    return;
  }

  if (request.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      try {
        console.log('[SW] navigate fetch', { pathname: url.pathname });

        // Locale-aware caching:
        // If you include a locale in the URL (recommended), caching is naturally separated.
        // When localePrefix is "never", the URL doesn't change per language; SW cannot
        // reliably read cookies, so we fallback to Accept-Language.
        const urlLocale = url.searchParams.get('__sw_locale');
        const acceptLanguage = getPrimaryAcceptLanguage(request.headers.get('accept-language'));
        const locale = urlLocale ?? acceptLanguage;
        const cacheKeyUrl = `${url.origin}${url.pathname}?__sw_locale=${encodeURIComponent(locale)}`;
        const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
        console.log('[SW] navigation cache key', { pathname: url.pathname, locale });

        const preload = await event.preloadResponse;
        if (preload) {
          console.log('[SW] using navigation preload', { pathname: url.pathname });
          // Opportunistically cache preload HTML
          try {
            const cache = await caches.open(PAGES_CACHE);
            await cache.put(cacheKey, preload.clone());
          } catch {}
          return preload;
        }
        const networkResponse = await fetch(request);
        console.log('[SW] network ok', { pathname: url.pathname, status: networkResponse.status });

        // Cache successful HTML navigations automatically on first visit.
        try {
          if (networkResponse.ok) {
            const cache = await caches.open(PAGES_CACHE);
            await cache.put(cacheKey, networkResponse.clone());
          }
        } catch {}

        return networkResponse;
      } catch {
        const urlLocale = url.searchParams.get('__sw_locale');
        const acceptLanguage = getPrimaryAcceptLanguage(request.headers.get('accept-language'));
        const locale = urlLocale ?? acceptLanguage;
        const cacheKeyUrl = `${url.origin}${url.pathname}?__sw_locale=${encodeURIComponent(locale)}`;
        const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
        const cache = await caches.open(PAGES_CACHE);
        const cached = await cache.match(cacheKey);
        if (cached) {
          console.log('[SW] offline cache hit', { pathname: url.pathname });
          return cached;
        }
        const anyLocale = await matchAnyLocalePage(cache, url.origin, url.pathname);
        if (anyLocale) {
          console.log('[SW] offline cache hit (any locale)', { pathname: url.pathname });
          return anyLocale;
        }

        const shell = await matchAppShell(cache, url.origin);
        if (shell) {
          console.log('[SW] offline fallback to app shell', { pathname: url.pathname });
          return shell;
        }

        console.log('[SW] offline cache miss', { pathname: url.pathname });
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })(),
  );
});

// ---- CORE SW LISTENERS ----

serwist.addEventListeners();
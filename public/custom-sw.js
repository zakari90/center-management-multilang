/* eslint-disable no-restricted-globals */

// Minimal custom Service Worker (no Serwist/Workbox precache)
// Runtime caching only.

const PAGES_CACHE = 'pages-v1';
const ASSETS_CACHE = 'assets-v1';
const OFFLINE_URL = '/offline.html';

const sw = self;

console.log('[SW] boot', { href: sw.location && sw.location.href });

sw.addEventListener('error', (event) => {
  console.log('[SW] error', {
    message: event && event.message,
    filename: event && event.filename,
    lineno: event && event.lineno,
    colno: event && event.colno,
  });
});

sw.addEventListener('unhandledrejection', (event) => {
  console.log('[SW] unhandledrejection', { reason: event && event.reason });
});

// Critical routes to pre-cache for offline support
const PRECACHE_ROUTES = [
  '/',
  '/ar',
  '/en',
  '/ar/manager',
  '/ar/admin',
  '/en/manager',
  '/ar/manager/teachers',
  '/en/manager/teachers',
  '/ar/manager/students',
  '/en/manager/students',
  '/ar/manager/receipts',
  '/en/manager/receipts',
  // Add more routes as needed
];

sw.addEventListener('install', (event) => {
  console.log('[SW] install');
  sw.skipWaiting();
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PAGES_CACHE);
        await cache.add(OFFLINE_URL);
        console.log('[SW] cached offline.html');
        
        // Pre-cache critical routes
        for (const route of PRECACHE_ROUTES) {
          try {
            const response = await fetch(route, { credentials: 'same-origin' });
            if (response.ok) {
              await cache.put(route, response.clone());
              console.log('[SW] pre-cached:', route);
            }
          } catch (e) {
            console.log('[SW] failed to pre-cache:', route, e);
          }
        }
      } catch (e) {
        console.log('[SW] install failed', e);
      }
    })(),
  );
});

sw.addEventListener('activate', (event) => {
  console.log('[SW] activate');
  event.waitUntil(
    (async () => {
      try {
        await sw.clients.claim();
        console.log('[SW] clients claimed');
      } catch (e) {
        console.log('[SW] clients claim failed', e);
      }
    })(),
  );
});

sw.addEventListener('message', (event) => {
  if (event && event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] received SKIP_WAITING');
    sw.skipWaiting();
  }
});

function getPrimaryAcceptLanguage(header) {
  if (!header) return 'ar';
  const first = header.split(',')[0] && header.split(',')[0].trim();
  if (!first) return 'ar';
  return (first.split(';')[0] && first.split(';')[0].trim()) || 'ar';
}

function getLocaleKey(request) {
  try {
    const lang = getPrimaryAcceptLanguage(request.headers.get('accept-language'));
    const short = (lang || 'ar').split('-')[0];
    return short || 'ar';
  } catch {
    return 'ar';
  }
}

async function matchAnyLocalePage(cache, origin, pathname) {
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

async function matchAppShell(cache, origin) {
  const shell = await matchAnyLocalePage(cache, origin, '/');
  if (shell) return shell;
  const plain = await cache.match('/');
  if (plain) return plain;
  return undefined;
}

sw.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cache Next.js static assets.
  if (url.origin === sw.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS_CACHE);
        const cached = await cache.match(url.pathname);
        if (cached) {
          event.waitUntil(
            fetch(request)
              .then((res) => {
                if (res && res.ok) return cache.put(url.pathname, res.clone());
              })
              .catch(() => {}),
          );
          return cached;
        }

        // Fallback: if pages were precached under the plain pathname (e.g. /ar/admin)
        // return that when offline/refreshing.
        const plainCached = await cache.match(url.pathname);
        if (plainCached) {
          return plainCached;
        }

        try {
          const res = await fetch(request);
          if (res && res.ok) await cache.put(url.pathname, res.clone());
          return res;
        } catch {
          return new Response('', { status: 504 });
        }
      })(),
    );
    return;
  }

  // Navigation requests (HTML): option C
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES_CACHE);
        const locale = getLocaleKey(request);
        const cacheKey = `${url.pathname}?__sw_locale=${locale}`;

        const cached = await cache.match(cacheKey);
        if (cached) {
          event.waitUntil(
            fetch(request)
              .then((res) => {
                if (res && res.ok) return cache.put(cacheKey, res.clone());
              })
              .catch(() => {}),
          );
          return cached;
        }

        try {
          const res = await fetch(request);
          if (res && res.ok) {
            // Store under both keys to stay compatible with precache + locale-aware runtime caching.
            await cache.put(cacheKey, res.clone());
            try {
              await cache.put(url.pathname, res.clone());
            } catch {}
          }
          return res;
        } catch {
          const anyLocale = await matchAnyLocalePage(cache, url.origin, url.pathname);
          if (anyLocale) return anyLocale;

          const shell = await matchAppShell(cache, url.origin);
          if (shell) return shell;

          try {
            const offlineCached = await cache.match(OFFLINE_URL);
            if (offlineCached) return offlineCached;
          } catch {}

          try {
            const offlineRes = await fetch(OFFLINE_URL, { cache: 'no-store' });
            if (offlineRes && offlineRes.ok) {
              try {
                await cache.put(OFFLINE_URL, offlineRes.clone());
              } catch {}
              return offlineRes;
            }
          } catch {}

          return new Response('Offline', {
            status: 503,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }
      })(),
    );
    return;
  }
});

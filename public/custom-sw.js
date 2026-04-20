/* eslint-disable no-restricted-globals */

// Minimal custom Service Worker (no Serwist/Workbox precache)
// Runtime caching only.

const SW_VERSION = "v1.2.0"; // Bumped for update
const PAGES_CACHE = `pages-${SW_VERSION}`;
const ASSETS_CACHE = `assets-${SW_VERSION}`;
const OFFLINE_URL = "/offline.html";

const sw = self;

console.log(`[SW] boot ${SW_VERSION}`, {
  href: sw.location && sw.location.href,
});

sw.addEventListener("error", (event) => {
  console.log("[SW] error", {
    message: event && event.message,
    filename: event && event.filename,
    lineno: event && event.lineno,
    colno: event && event.colno,
  });
});

sw.addEventListener("unhandledrejection", (event) => {
  console.log("[SW] unhandledrejection", { reason: event && event.reason });
});

// Critical routes to pre-cache for offline support
const PRECACHE_ROUTES = [
  "/",
  "/ar",
  "/en",
  "/fr",
  "/ar/pro/manager",
  "/ar/pro/admin",
  "/fr/pro/manager",
  "/fr/pro/admin",
  "/en/pro/manager",
  "/en/pro/admin",
  "/ar/pro/manager/teachers",
  "/en/pro/manager/teachers",
  "/fr/pro/manager/teachers",
  "/ar/pro/manager/students",
  "/en/pro/manager/students",
  "/fr/pro/manager/students",
  "/ar/pro/manager/receipts",
  "/en/pro/manager/receipts",
  "/fr/pro/manager/receipts",
  "/ar/pro/admin/center",
  "/en/pro/admin/center",
  "/fr/pro/admin/center",
  "/ar/pro/admin/users",
  "/en/pro/admin/users",
  "/fr/pro/admin/users",
  "/ar/pro/admin/receipts",
  "/en/pro/admin/receipts",
  "/fr/pro/admin/receipts",
  "/ar/pro/admin/schedule",
  "/en/pro/admin/schedule",
  "/fr/pro/admin/schedule",
];

// Network timeout for navigation requests (ms)
const NAVIGATION_TIMEOUT_MS = 3000;

sw.addEventListener("install", (event) => {
  console.log("[SW] install", SW_VERSION);
  // Do NOT call skipWaiting() here — let the UI show an update alert first.
  // The waiting SW will be activated when the user clicks "Update" via SKIP_WAITING message.
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PAGES_CACHE);
        await cache.add(OFFLINE_URL);
        console.log("[SW] cached offline.html");

        // Pre-cache critical routes
        for (const route of PRECACHE_ROUTES) {
          try {
            const response = await fetch(route, { credentials: "same-origin" });
            if (response.ok) {
              await cache.put(route, response.clone());
              console.log("[SW] pre-cached:", route);
            }
          } catch (e) {
            console.log("[SW] failed to pre-cache:", route, e);
          }
        }
      } catch (e) {
        console.log("[SW] install failed", e);
      }
    })(),
  );
});

sw.addEventListener("activate", (event) => {
  console.log("[SW] activate", SW_VERSION);
  event.waitUntil(
    (async () => {
      try {
        // Cache purging: Delete old caches that don't match the current version
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => {
              return (
                (name.startsWith("pages-") || name.startsWith("assets-")) &&
                name !== PAGES_CACHE &&
                name !== ASSETS_CACHE
              );
            })
            .map((name) => {
              console.log("[SW] deleting old cache:", name);
              return caches.delete(name);
            }),
        );

        await sw.clients.claim();
        console.log("[SW] clients claimed");
      } catch (e) {
        console.log("[SW] activation failed", e);
      }
    })(),
  );
});

sw.addEventListener("message", (event) => {
  if (event && event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] received SKIP_WAITING");
    sw.skipWaiting();
  }
});

function getPrimaryAcceptLanguage(header) {
  if (!header) return "ar";
  const first = header.split(",")[0] && header.split(",")[0].trim();
  if (!first) return "ar";
  return (first.split(";")[0] && first.split(";")[0].trim()) || "ar";
}

function getLocaleKey(request) {
  try {
    const lang = getPrimaryAcceptLanguage(
      request.headers.get("accept-language"),
    );
    const short = (lang || "ar").split("-")[0];
    return short || "ar";
  } catch {
    return "ar";
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
  const shell = await matchAnyLocalePage(cache, origin, "/");
  if (shell) return shell;
  const plain = await cache.match("/");
  if (plain) return plain;
  return undefined;
}

/**
 * Race a fetch against a timeout. Returns the response if the network
 * answers within `ms`, otherwise rejects so the caller can fall back to cache.
 */
function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).then(
    (res) => {
      clearTimeout(timeoutId);
      return res;
    },
    (err) => {
      clearTimeout(timeoutId);
      throw err;
    },
  );
}

sw.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request || request.method !== "GET") return;

  const url = new URL(request.url);

  // Cache Next.js static assets (stale-while-revalidate).
  if (
    url.origin === sw.location.origin &&
    url.pathname.startsWith("/_next/static/")
  ) {
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

        try {
          const res = await fetch(request);
          if (res && res.ok) await cache.put(url.pathname, res.clone());
          return res;
        } catch {
          return new Response("", { status: 504 });
        }
      })(),
    );
    return;
  }

  // ── Navigation requests: network-first with timeout ──────────────
  // Only intercept real page navigations (not RSC data fetches, prefetches, etc.)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES_CACHE);
        const locale = getLocaleKey(request);
        const cacheKey = `${url.pathname}?__sw_locale=${locale}`;

        try {
          // Try network first, with a timeout so slow connections
          // fall back to the cache instead of hanging forever.
          const res = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
          if (res && res.ok) {
            // Store under both keys for precache + locale-aware lookup.
            await cache.put(cacheKey, res.clone());
            try {
              await cache.put(url.pathname, res.clone());
            } catch {}
          }
          return res;
        } catch {
          // Network failed or timed out — serve from cache.
          console.log("[SW] network failed, trying cache for:", url.pathname);

          const cached = await cache.match(cacheKey);
          if (cached) return cached;

          const anyLocale = await matchAnyLocalePage(
            cache,
            url.origin,
            url.pathname,
          );
          if (anyLocale) return anyLocale;

          // Try the plain pathname (from precache).
          const plainCached = await cache.match(url.pathname);
          if (plainCached) return plainCached;

          // Try the app shell as a last-resort SPA fallback.
          const shell = await matchAppShell(cache, url.origin);
          if (shell) return shell;

          // Nothing cached — show the offline page.
          try {
            const offlineCached = await cache.match(OFFLINE_URL);
            if (offlineCached) return offlineCached;
          } catch {}

          return new Response("Offline", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
    return;
  }
  // ── Push Notifications ───────────────────────────────────────────
});

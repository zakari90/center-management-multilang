/// <reference lib="webworker" />

// Next.js/TS builds often include DOM libs, which can type `self` as `Window`.
// To avoid build errors (and because this file is executed as a Service Worker),
// we use a minimal `any` typing here.
const sw: any = self as any;

console.log("[SW] boot", { href: sw.location?.href });

sw.addEventListener("error", (event: any) => {
  // Surface SW script errors that prevent install/activate.
  console.log("[SW] error", {
    message: (event as ErrorEvent).message,
    filename: (event as ErrorEvent).filename,
    lineno: (event as ErrorEvent).lineno,
    colno: (event as ErrorEvent).colno,
  });
});

sw.addEventListener("unhandledrejection", (event: any) => {
  console.log("[SW] unhandledrejection", {
    reason: (event as PromiseRejectionEvent).reason,
  });
});

const PAGES_CACHE = "pages-v1";
const ASSETS_CACHE = "assets-v1";

sw.addEventListener("install", (event: any) => {
  console.log("[SW] install");
  // Activate new SW immediately.
  sw.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(ASSETS_CACHE);
      await cache.add("/offline.html");
      console.log("[SW] precached /offline.html");
    })(),
  );
});

sw.addEventListener("activate", (event: any) => {
  console.log("[SW] activate");
  event.waitUntil(
    (async () => {
      try {
        await sw.clients.claim();
        console.log("[SW] clients claimed");
      } catch (e) {
        console.log("[SW] clients claim failed", e);
      }
    })(),
  );
});

function getPrimaryAcceptLanguage(header: string | null): string {
  if (!header) return "ar";
  const first = header.split(",")[0]?.trim();
  if (!first) return "ar";
  return first.split(";")[0]?.trim() || "ar";
}

async function matchAnyLocalePage(
  cache: Cache,
  origin: string,
  pathname: string,
): Promise<Response | undefined> {
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

async function matchAppShell(
  cache: Cache,
  origin: string,
): Promise<Response | undefined> {
  // Try to serve the dedicated offline page from assets cache first
  const assetsCache = await caches.open(ASSETS_CACHE);
  const offlinePage = await assetsCache.match("/offline.html");
  if (offlinePage) return offlinePage;

  // Fallback to app shell (home page) if offline.html is missing
  const shell = await matchAnyLocalePage(cache, origin, "/");
  if (shell) return shell;

  const plain = await cache.match("/");
  if (plain) return plain;

  return undefined;
}

sw.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] received SKIP_WAITING");
    sw.skipWaiting();
  }
});

sw.addEventListener("fetch", (event: any) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Automatically cache Next.js static assets (JS/CSS/fonts/etc) so the app can hydrate offline.
  // We keep this independent from Serwist precache to avoid install failures.
  if (
    url.origin === sw.location.origin &&
    url.pathname.startsWith("/_next/static/")
  ) {
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
          return new Response("", { status: 504 });
        }
      })(),
    );
    return;
  }

  if (request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      console.log("[SW] navigate fetch", { pathname: url.pathname });

      // Locale-aware caching:
      // If you include a locale in the URL (recommended), caching is naturally separated.
      // When localePrefix is "never", the URL doesn't change per language; SW cannot
      // reliably read cookies, so we fallback to Accept-Language.
      const urlLocale = url.searchParams.get("__sw_locale");
      const acceptLanguage = getPrimaryAcceptLanguage(
        request.headers.get("accept-language"),
      );
      const locale = urlLocale ?? acceptLanguage;
      const cacheKeyUrl = `${url.origin}${url.pathname}?__sw_locale=${encodeURIComponent(locale)}`;
      const cacheKey = new Request(cacheKeyUrl, { method: "GET" });
      console.log("[SW] navigation cache key", {
        pathname: url.pathname,
        locale,
      });

      const cache = await caches.open(PAGES_CACHE);

      // Option C: Cache-first IF cached exists, otherwise go network and cache.
      const cached = await cache.match(cacheKey);
      if (cached) {
        // Revalidate in background
        event.waitUntil(
          (async () => {
            try {
              const res = await fetch(request);
              if (res.ok) await cache.put(cacheKey, res.clone());
            } catch {}
          })(),
        );
        return cached;
      }

      // If no cached exact key, try navigation preload then network.
      try {
        const preload = await event.preloadResponse;
        if (preload) {
          console.log("[SW] using navigation preload", {
            pathname: url.pathname,
          });
          try {
            await cache.put(cacheKey, preload.clone());
          } catch {}
          return preload;
        }

        const networkResponse = await fetch(request);
        console.log("[SW] network ok", {
          pathname: url.pathname,
          status: networkResponse.status,
        });
        try {
          if (networkResponse.ok) {
            await cache.put(cacheKey, networkResponse.clone());
          }
        } catch {}
        return networkResponse;
      } catch {
        // Offline fallback chain
        const anyLocale = await matchAnyLocalePage(
          cache,
          url.origin,
          url.pathname,
        );
        if (anyLocale) {
          console.log("[SW] offline cache hit (any locale)", {
            pathname: url.pathname,
          });
          return anyLocale;
        }

        const shell = await matchAppShell(cache, url.origin);
        if (shell) {
          console.log("[SW] offline fallback to app shell", {
            pathname: url.pathname,
          });
          return shell;
        }

        console.log("[SW] offline cache miss", { pathname: url.pathname });
        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});

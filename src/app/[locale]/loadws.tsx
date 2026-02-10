"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LoadWS() {
  const hasRegistered = useRef(false);
  const initialHadController = useRef(false);
  const didReloadForControl = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (typeof pathname !== "string" || pathname.length === 0) return;
      const key = "visited-pages";
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const current = Array.isArray(parsed)
        ? (parsed.filter((p) => typeof p === "string") as string[])
        : [];
      const next = [pathname, ...current.filter((p) => p !== pathname)].slice(
        0,
        50,
      );
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    // Prevent double registration (React Strict Mode in development)
    if (hasRegistered.current) return;

    if ("serviceWorker" in navigator) {
      hasRegistered.current = true;
      initialHadController.current = !!navigator.serviceWorker.controller;
      const onControllerChange = () => {
        // Reload only once to pick up control on first install.
        // Avoid infinite reloads / aborting navigations on updates.
        if (initialHadController.current) return;
        if (didReloadForControl.current) return;
        if (!navigator.serviceWorker.controller) return;
        didReloadForControl.current = true;
        console.log(
          "[SW] controllerchange -> reloading once to become controlled",
        );
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );

      navigator.serviceWorker
        .register("/custom-sw.js", { updateViaCache: "none" })
        .then((registration) => {
          console.log("Service Worker registered");

          console.log("[SW] registration state", {
            active: !!registration.active,
            waiting: !!registration.waiting,
            installing: !!registration.installing,
            scope: registration.scope,
            scriptURL:
              registration.active?.scriptURL ??
              registration.waiting?.scriptURL ??
              registration.installing?.scriptURL ??
              null,
          });

          fetch("/custom-sw.js", { cache: "no-store" })
            .then(async (r) => {
              console.log("[SW] /custom-sw.js fetched", {
                ok: r.ok,
                status: r.status,
                contentType: r.headers.get("content-type"),
              });
              if (!r.ok) return;
              const text = await r.text().catch(() => "");
              console.log("[SW] /custom-sw.js first bytes", text.slice(0, 120));
            })
            .catch((e) => {
              console.log("[SW] /custom-sw.js fetch failed", e);
            });

          const attachInstalling = (installing: ServiceWorker) => {
            installing.addEventListener("error", (e) => {
              console.log("[SW] installing error event", e);
            });
            installing.addEventListener("statechange", () => {
              console.log("[SW] statechange", { state: installing.state });
              if (installing.state === "redundant") {
                console.log(
                  "[SW] installing became redundant (likely install failure)",
                );
              }
            });

            // Some failures do not trigger statechange logs reliably in the page console.
            // Poll a few times to see if it gets stuck.
            let tries = 0;
            const id = window.setInterval(() => {
              tries += 1;
              console.log("[SW] installing poll", { state: installing.state });
              if (
                installing.state === "activated" ||
                installing.state === "redundant" ||
                tries >= 10
              ) {
                window.clearInterval(id);
              }
            }, 500);
          };

          if (registration.installing) {
            attachInstalling(registration.installing);
          }

          // Do NOT call skipWaiting here — let PWAUpdateHandler show the
          // update alert first. The user clicks "Update" which sends SKIP_WAITING.

          registration.addEventListener("updatefound", () => {
            console.log("[SW] updatefound");
            const installing = registration.installing;
            if (!installing) return;
            attachInstalling(installing);
          });

          // Ensure we fetch the latest SW after deployments
          registration.update().catch((error) => {
            console.error("Error updating Service Worker:", error);
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      return () => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onControllerChange,
        );
      };
    }
  }, []);

  return <div></div>;
}

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

        window.location.reload();
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );

      navigator.serviceWorker
        .register("/custom-sw.js", { updateViaCache: "none" })
        .then((registration) => {
          fetch("/custom-sw.js", { cache: "no-store" })
            .then(async (r) => {})
            .catch((e) => {});

          const attachInstalling = (installing: ServiceWorker) => {
            installing.addEventListener("error", (e) => {});
            installing.addEventListener("statechange", () => {});

            // Some failures do not trigger statechange logs reliably in the page console.
            // Poll a few times to see if it gets stuck.
            let tries = 0;
            const id = window.setInterval(() => {
              tries += 1;

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
            const installing = registration.installing;
            if (!installing) return;
            attachInstalling(installing);
          });

          // Ensure we fetch the latest SW after deployments
          registration.update().catch((error) => {});
        })
        .catch((error) => {});

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

"use client";

import { useEffect } from "react";

/**
 * Component to ensure service worker is registered
 * @serwist/next should auto-register, but this provides a fallback
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check if service worker is already registered
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) {
          // Try to register the service worker manually as fallback
          navigator.serviceWorker
            .register("/custom-sw.js", { updateViaCache: 'none' }) // keep aligned with LoadWS
            .then((reg) => {
              console.log("[SW] Service worker registered:", reg.scope);
              reg.update().catch(() => {});
            })
            .catch((error) => {
              console.error("[SW] Registration failed:", error);
            });
        } else {
          console.log("[SW] Service worker already registered:", registration.scope);
          registration.update().catch(() => {});
        }
      })
      .catch((error) => {
        console.error("[SW] Get registration failed:", error);
      });

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[SW] Controller changed, reloading page");
      window.location.reload();
    });
  }, []);

  return null;
}


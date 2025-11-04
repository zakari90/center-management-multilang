export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) {
          navigator.serviceWorker
            .register("/index.js") // <-- Changed from /worker/index.ts to /sw.js
            .then((reg) => {
              console.log("[SW] Service worker registered:", reg.scope);
            })
            .catch((error) => {
              console.error("[SW] Registration failed:", error);
            });
        } else {
          console.log("[SW] Service worker already registered:", registration.scope);
        }
      })
      .catch((error) => {
        console.error("[SW] Get registration failed:", error);
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[SW] Controller changed, reloading page");
      window.location.reload();
    });
  }, []);

  return null;
}

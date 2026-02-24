export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Verifies if the server is actually reachable.
 * Uses a cache-busting timestamp and no-store to bypass service worker/browser cache.
 */
export async function checkReachability(): Promise<boolean> {
  if (typeof window === "undefined") return true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`/api/health?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.debug("[Network] Reachability check failed:", error);
    return false;
  }
}

/**
 * Combines navigator.onLine with an active reachability check.
 */
export async function verifyOnline(): Promise<boolean> {
  if (!isOnline()) return false;
  return await checkReachability();
}

export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      // Even if navigator says online, it might be a false positive.
      // But waitForOnline is typically used to wait for the EVENT.
      // The caller should ideally verify reachability after this resolves.
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener("online", handleOnline);
      resolve();
    };

    window.addEventListener("online", handleOnline);
  });
}

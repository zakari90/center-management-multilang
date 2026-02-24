import { useEffect, useState, useCallback, useRef } from "react";
import { checkReachability } from "@/lib/utils/network";

export interface OnlineStatus {
  isOnline: boolean;
  lastOnline?: Date;
  offlineTime?: number; // milliseconds offline
}

/**
 * Hook to track online/offline status
 * @returns Object with isOnline boolean and offline duration
 */
export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  });

  const [goingOfflineTime, setGoingOfflineTime] = useState<number | null>(null);
  const isVerifying = useRef(false);

  useEffect(() => {
    const performReachabilityCheck = async () => {
      if (isVerifying.current) return;
      isVerifying.current = true;

      const isReachable = await checkReachability();

      if (isReachable) {
        setStatus({
          isOnline: true,
          lastOnline: new Date(),
          offlineTime: goingOfflineTime ? Date.now() - goingOfflineTime : 0,
        });
        setGoingOfflineTime(null);
      } else {
        // Still effectively offline if server unreachable
        setStatus((prev) => ({
          ...prev,
          isOnline: false,
        }));
      }
      isVerifying.current = false;
    };

    const handleOnline = () => {
      // Don't trust the browser, verify reachability
      performReachabilityCheck();
    };

    const handleOffline = () => {
      setGoingOfflineTime(Date.now());
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    // Initial check
    if (navigator.onLine) {
      performReachabilityCheck();
    } else {
      setStatus({
        isOnline: false,
        lastOnline: undefined,
      });
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check if "online" but might have lost reachability silently
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        performReachabilityCheck();
      }
    }, 30000); // Check every 30s

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [goingOfflineTime]);

  return status;
}

/**
 * Hook that returns true if online, false if offline
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const isVerifying = useRef(false);

  useEffect(() => {
    const performCheck = async () => {
      if (isVerifying.current) return;
      isVerifying.current = true;
      const reachable = await checkReachability();
      setIsOnline(reachable);
      isVerifying.current = false;
    };

    if (navigator.onLine) {
      performCheck();
    } else {
      setIsOnline(false);
    }

    const handleOnline = () => {
      performCheck();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        performCheck();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
}

/**
 * Hook that provides offline status and actions
 */
export function useOfflineStatus() {
  const status = useOnlineStatus();
  const isOnline = useIsOnline();

  const formatOfflineTime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }, []);

  return {
    isOnline,
    lastOnline: status.lastOnline,
    offlineTime: status.offlineTime,
    offlineTimeFormatted: status.offlineTime
      ? formatOfflineTime(status.offlineTime)
      : null,
    wasOffline: !isOnline,
  };
}

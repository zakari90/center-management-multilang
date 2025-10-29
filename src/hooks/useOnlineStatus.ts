import { useEffect, useState, useCallback } from 'react';

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
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  const [goingOfflineTime, setGoingOfflineTime] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setStatus({
        isOnline: true,
        lastOnline: new Date(),
        offlineTime: goingOfflineTime ? Date.now() - goingOfflineTime : 0,
      });
      setGoingOfflineTime(null);
    };

    const handleOffline = () => {
      setGoingOfflineTime(Date.now());
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    // Set initial state
    const isCurrentlyOnline = navigator.onLine;
    setStatus({
      isOnline: isCurrentlyOnline,
      lastOnline: isCurrentlyOnline ? new Date() : undefined,
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [goingOfflineTime]);

  return status;
}

/**
 * Hook that returns true if online, false if offline
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    offlineTimeFormatted: status.offlineTime ? formatOfflineTime(status.offlineTime) : null,
    wasOffline: !isOnline,
  };
}

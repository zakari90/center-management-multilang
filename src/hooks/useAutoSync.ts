/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  syncAllEntitiesForRole,
  importAllFromServerForRole,
} from "@/lib/dexie/serverActions";
import { isOnline, verifyOnline, waitForOnline } from "@/lib/utils/network";
import { useAuth } from "@/context/authContext";

export interface AutoSyncOptions {
  /**
   * Enable auto-sync on app startup (import from server)
   * @default true
   */
  syncOnMount?: boolean;

  /**
   * Enable periodic sync (every X minutes)
   * @default true
   */
  periodicSync?: boolean;

  /**
   * Interval for periodic sync in minutes
   * @default 5
   */
  syncInterval?: number;

  /**
   * Enable sync on network reconnection
   * @default true
   */
  syncOnReconnect?: boolean;

  /**
   * Enable sync before page unload (when user closes tab/app)
   * @default true
   */
  syncBeforeUnload?: boolean;

  /**
   * Enable import on mount (pull data from server)
   * @default false (only sync local changes)
   */
  importOnMount?: boolean;

  /**
   * Callback when sync starts
   */
  onSyncStart?: () => void;

  /**
   * Callback when sync completes
   */
  onSyncComplete?: (success: boolean, results?: any) => void;

  /**
   * Callback when sync fails
   */
  onSyncError?: (error: Error) => void;

  /**
   * Show console logs for debugging
   * @default false
   */
  debug?: boolean;
}

const DEFAULT_OPTIONS: Required<AutoSyncOptions> = {
  syncOnMount: true,
  periodicSync: true,
  syncInterval: 5,
  syncOnReconnect: true,
  syncBeforeUnload: true,
  importOnMount: false,
  onSyncStart: () => {},
  onSyncComplete: () => {},
  onSyncError: () => {},
  debug: false,
};

/**
 * Custom hook for automatic data synchronization
 *
 * @example
 * ```tsx
 * // Basic usage
 * useAutoSync();
 *
 * // With custom options
 * useAutoSync({
 *   syncInterval: 10, // Sync every 10 minutes
 *   importOnMount: true, // Import on startup
 *   onSyncComplete: (success) => {
 *     if (success) toast.success('Synced!');
 *   }
 * });
 * ```
 */
export function useAutoSync(options: AutoSyncOptions = {}) {
  const { user } = useAuth();
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const isAdmin = user?.role === "ADMIN";

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);
  const sessionCacheRef = useRef<{ valid: boolean; time: number } | null>(null);
  const SESSION_CACHE_TTL = 30_000; // 30 seconds

  const log = useCallback(
    (message: string, ...args: any[]) => {
      if (opts.debug) {
        console.log(`[AutoSync]`, message, ...args);
      }
    },
    [opts.debug],
  );

  /**
   * Validate that server session is valid before attempting sync
   */
  const validateServerSession = useCallback(async (): Promise<boolean> => {
    // Return cached result if still fresh (avoids a round-trip before every periodic sync)
    if (
      sessionCacheRef.current &&
      Date.now() - sessionCacheRef.current.time < SESSION_CACHE_TTL
    ) {
      return sessionCacheRef.current.valid;
    }

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      const valid = response.ok;
      sessionCacheRef.current = { valid, time: Date.now() };

      if (!valid) {
        log(
          "Server session invalid or expired (status: " + response.status + ")",
        );
        return false;
      }

      log("Server session validated successfully");
      return true;
    } catch (error) {
      sessionCacheRef.current = { valid: false, time: Date.now() };
      log("Failed to validate server session:", error);
      return false;
    }
  }, [log, SESSION_CACHE_TTL]);

  /**
   * Perform sync operation (push local changes to server)
   */
  const performSync = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      log("Sync already in progress, skipping...");
      return false;
    }

    if (!(await verifyOnline())) {
      log("Device is offline or server unreachable, skipping sync");
      return false;
    }

    if (!user) {
      log("User not authenticated (client), skipping sync");
      return false;
    }

    // Validate server session before attempting sync
    const serverSessionValid = await validateServerSession();
    if (!serverSessionValid) {
      log(
        "Server session not valid, skipping sync (user may need to re-login)",
      );
      return false;
    }

    isSyncingRef.current = true;
    opts.onSyncStart();

    try {
      log("Starting sync...");
      const results = await syncAllEntitiesForRole(isAdmin);

      // Check if sync was successful
      let success = true;
      const resultEntries = Object.entries(results);

      for (const [key, result] of resultEntries) {
        if (result.status === "rejected") {
          success = false;
          log(`Sync failed for ${key}:`, result.reason);
        } else if (
          result.status === "fulfilled" &&
          (result.value as any)?.failCount > 0
        ) {
          success = false;
          log(
            `Sync completed with failures for ${key}:`,
            (result.value as any).failCount,
            "failed",
          );
        }
      }

      lastSyncTimeRef.current = Date.now();
      log("Sync completed", success ? "successfully" : "with errors");

      opts.onSyncComplete(success, results);
      return success;
    } catch (error) {
      log("Sync error:", error);
      opts.onSyncError(
        error instanceof Error ? error : new Error("Unknown sync error"),
      );
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAdmin, user, opts, log]);

  /**
   * Perform import operation (pull data from server)
   */
  const performImport = useCallback(async (): Promise<boolean> => {
    if (isSyncingRef.current) {
      log("Sync in progress, skipping import");
      return false;
    }

    if (!(await verifyOnline())) {
      log("Device is offline or server unreachable, skipping import");
      return false;
    }

    if (!user) {
      log("User not authenticated (client), skipping import");
      return false;
    }

    // Validate server session before attempting import
    const serverSessionValid = await validateServerSession();
    if (!serverSessionValid) {
      log(
        "Server session not valid, skipping import (user may need to re-login)",
      );
      return false;
    }

    isSyncingRef.current = true;
    opts.onSyncStart();

    try {
      log("Starting import...");
      const results = await importAllFromServerForRole(isAdmin);

      let success = true;
      const resultEntries = Object.entries(results);

      for (const [, result] of resultEntries) {
        if (result.status === "rejected") {
          success = false;
          log("Import failed for some entities:", result.reason);
        }
      }

      log("Import completed", success ? "successfully" : "with errors");
      opts.onSyncComplete(success, results);
      return success;
    } catch (error) {
      log("Import error:", error);
      opts.onSyncError(
        error instanceof Error ? error : new Error("Unknown import error"),
      );
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAdmin, user, opts, log]);

  /**
   * Handle network reconnection
   */
  useEffect(() => {
    if (!opts.syncOnReconnect) return;

    const handleOnline = async () => {
      log("Network reconnected, waiting for stable connection...");
      await waitForOnline();

      // ✅ CRITICAL: Always sync local changes FIRST to push pending modifications to server
      log("Connection stable, syncing local changes first...");
      await performSync();

      // Then import new data from server (only if importOnMount is enabled)
      if (opts.importOnMount) {
        log("Local changes synced, now importing from server...");
        await performImport();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [
    opts.syncOnReconnect,
    opts.importOnMount,
    performSync,
    performImport,
    log,
  ]);

  /**
   * Sync on mount (startup)
   */
  useEffect(() => {
    if (!opts.syncOnMount && !opts.importOnMount) return;
    if (!user) return;

    const initialize = async () => {
      // Wait for network if offline
      if (!isOnline()) {
        log("Offline on mount, waiting for connection...");
        await waitForOnline();
      }

      if (opts.importOnMount) {
        log("Importing data on mount...");
        await performImport();

        // After importing server state into Dexie, push local pending changes
        if (opts.syncOnMount) {
          log("Syncing after import...");
          await performSync();
        }
      } else if (opts.syncOnMount) {
        log("Syncing on mount...");
        await performSync();
      }
    };

    // Small delay to ensure app is fully loaded
    const timer = setTimeout(initialize, 1000);

    return () => clearTimeout(timer);
  }, [
    opts.syncOnMount,
    opts.importOnMount,
    user,
    performSync,
    performImport,
    log,
  ]);

  /**
   * Periodic sync
   */
  useEffect(() => {
    if (!opts.periodicSync || !user) return;

    const intervalMs = opts.syncInterval * 60 * 1000; // Convert minutes to milliseconds

    syncIntervalRef.current = setInterval(() => {
      if (isOnline() && !isSyncingRef.current) {
        log(`Periodic sync (every ${opts.syncInterval} minutes)`);
        performSync();
      } else {
        log("Skipping periodic sync (offline or sync in progress)");
      }
    }, intervalMs);

    log(`Periodic sync enabled (every ${opts.syncInterval} minutes)`);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [opts.periodicSync, opts.syncInterval, user, performSync, log]);

  /**
   * Sync before page unload
   */
  useEffect(() => {
    if (!opts.syncBeforeUnload || !user) return;

    // Use visibilitychange for better reliability (beforeunload is too late for async ops)
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        isOnline() &&
        !isSyncingRef.current
      ) {
        log("Page hidden, performing sync...");
        performSync().catch((err) => {
          log("Background sync failed:", err);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [opts.syncBeforeUnload, user, performSync, log]);

  return {
    performSync,
    performImport,
    isSyncing: isSyncingRef.current,
    lastSyncTime: lastSyncTimeRef.current,
  };
}

"use client";

import { useAutoSync } from "@/hooks/useAutoSync";

/**
 * Provider component that enables auto-sync for the entire app
 * Add this to your root layout or dashboard pages
 *
 * @example
 * ```tsx
 * // In layout.tsx or page.tsx
 * <AutoSyncProvider />
 * ```
 */
export function AutoSyncProvider() {
  // Auto-sync configuration
  useAutoSync({
    syncOnMount: true, // Sync local changes on app startup
    periodicSync: true, // Sync every 5 minutes
    syncInterval: 5, // 5 minutes
    syncOnReconnect: true, // Sync when network reconnects
    syncBeforeUnload: true, // Sync before page closes
    importOnMount: true, // Don't import on mount (only sync local changes)
    debug: process.env.NODE_ENV === "development", // Show logs in dev mode
    onSyncStart: () => {
      // Optional: Show loading indicator
    },
    onSyncComplete: (success, results) => {
      if (success) {
        // Sync succeeded — nothing to show for offline-first PWA
      } else {
        // Offline-first: silently log sync failures (server may be unreachable)
        if (results) {
          Object.entries(results).forEach(([key, result]: [string, any]) => {
            if (result.status === "rejected") {
              console.warn(
                `⚠️ ${key} sync skipped (server unreachable):`,
                result.reason?.message || result.reason,
              );
            } else if (result.value?.failCount > 0) {
              console.warn(`⚠️ ${key} partial sync failure:`, result.value);
            }
          });
        }
        console.warn(
          "📋 Sync completed with issues (offline-first mode):",
          results,
        );
      }
    },
    onSyncError: (error) => {
      // Offline-first: silently log — don't bother the user
      console.warn("Auto-sync skipped (server unreachable):", error.message);
    },
  });

  // Don't render anything, just enable auto-sync
  return null;
}

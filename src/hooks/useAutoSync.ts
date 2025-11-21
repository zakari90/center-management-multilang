// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useRef, useCallback, useMemo } from 'react';
// import { syncAllEntitiesForRole, importAllFromServerForRole } from '@/lib/dexie/serverActions';
// import { isOnline, waitForOnline } from '@/lib/utils/network';
// import { useAuth } from '@/context/authContext';

// export interface AutoSyncOptions {
//   /**
//    * Enable auto-sync on app startup (import from server)
//    * @default true
//    */
//   syncOnMount?: boolean;
  
//   /**
//    * Enable periodic sync (every X minutes)
//    * @default true
//    */
//   periodicSync?: boolean;
  
//   /**
//    * Interval for periodic sync in minutes
//    * @default 5
//    */
//   syncInterval?: number;
  
//   /**
//    * Enable sync on network reconnection
//    * @default true
//    */
//   syncOnReconnect?: boolean;
  
//   /**
//    * Enable sync before page unload (when user closes tab/app)
//    * @default true
//    */
//   syncBeforeUnload?: boolean;
  
//   /**
//    * Enable import on mount (pull data from server)
//    * @default false (only sync local changes)
//    */
//   importOnMount?: boolean;
  
//   /**
//    * Callback when sync starts
//    */
//   onSyncStart?: () => void;
  
//   /**
//    * Callback when sync completes
//    */
//   onSyncComplete?: (success: boolean, results?: any) => void;
  
//   /**
//    * Callback when sync fails
//    */
//   onSyncError?: (error: Error) => void;
  
//   /**
//    * Show console logs for debugging
//    * @default false
//    */
//   debug?: boolean;
// }

// const DEFAULT_OPTIONS: Required<AutoSyncOptions> = {
//   syncOnMount: true,
//   periodicSync: true,
//   syncInterval: 5,
//   syncOnReconnect: true,
//   syncBeforeUnload: true,
//   importOnMount: false,
//   onSyncStart: () => {},
//   onSyncComplete: () => {},
//   onSyncError: () => {},
//   debug: false,
// };

// /**
//  * Custom hook for automatic data synchronization
//  * 
//  * @example
//  * ```tsx
//  * // Basic usage
//  * useAutoSync();
//  * 
//  * // With custom options
//  * useAutoSync({
//  *   syncInterval: 10, // Sync every 10 minutes
//  *   importOnMount: true, // Import on startup
//  *   onSyncComplete: (success) => {
//  *     if (success) toast.success('Synced!');
//  *   }
//  * });
//  * ```
//  */
// export function useAutoSync(options: AutoSyncOptions = {}) {
//   const { user } = useAuth();
//   const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
//   const isAdmin = user?.role === 'ADMIN';
  
//   const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const isSyncingRef = useRef(false);
//   const lastSyncTimeRef = useRef<number>(0);
  
//   const log = useCallback((message: string, ...args: any[]) => {
//     if (opts.debug) {
//       console.log(`[AutoSync] ${message}`, ...args);
//     }
//   }, [opts.debug]);
  
//   /**
//    * Perform sync operation (push local changes to server)
//    */
//   const performSync = useCallback(async (): Promise<boolean> => {
//     // Prevent concurrent syncs
//     if (isSyncingRef.current) {
//       log('Sync already in progress, skipping...');
//       return false;
//     }
    
//     if (!isOnline()) {
//       log('Device is offline, skipping sync');
//       return false;
//     }
    
//     if (!user) {
//       log('User not authenticated, skipping sync');
//       return false;
//     }
    
//     isSyncingRef.current = true;
//     opts.onSyncStart();
    
//     try {
//       log('Starting sync...');
//       const results = await syncAllEntitiesForRole(isAdmin);
      
//       // Check if sync was successful
//       let success = true;
//       const resultEntries = Object.entries(results);
      
//       for (const [, result] of resultEntries) {
//         if (result.status === 'rejected') {
//           success = false;
//           log('Sync failed for some entities:', result.reason);
//         }
//       }
      
//       lastSyncTimeRef.current = Date.now();
//       log('Sync completed', success ? 'successfully' : 'with errors');
      
//       opts.onSyncComplete(success, results);
//       return success;
//     } catch (error) {
//       log('Sync error:', error);
//       opts.onSyncError(error instanceof Error ? error : new Error('Unknown sync error'));
//       return false;
//     } finally {
//       isSyncingRef.current = false;
//     }
//   }, [isAdmin, user, opts, log]);
  
//   /**
//    * Perform import operation (pull data from server)
//    */
//   const performImport = useCallback(async (): Promise<boolean> => {
//     if (isSyncingRef.current) {
//       log('Sync in progress, skipping import');
//       return false;
//     }
    
//     if (!isOnline()) {
//       log('Device is offline, skipping import');
//       return false;
//     }
    
//     if (!user) {
//       log('User not authenticated, skipping import');
//       return false;
//     }
    
//     isSyncingRef.current = true;
//     opts.onSyncStart();
    
//     try {
//       log('Starting import...');
//       const results = await importAllFromServerForRole(isAdmin);
      
//       let success = true;
//       const resultEntries = Object.entries(results);
      
//       for (const [, result] of resultEntries) {
//         if (result.status === 'rejected') {
//           success = false;
//           log('Import failed for some entities:', result.reason);
//         }
//       }
      
//       log('Import completed', success ? 'successfully' : 'with errors');
//       opts.onSyncComplete(success, results);
//       return success;
//     } catch (error) {
//       log('Import error:', error);
//       opts.onSyncError(error instanceof Error ? error : new Error('Unknown import error'));
//       return false;
//     } finally {
//       isSyncingRef.current = false;
//     }
//   }, [isAdmin, user, opts, log]);
  
//   /**
//    * Handle network reconnection
//    */
//   useEffect(() => {
//     if (!opts.syncOnReconnect) return;
    
//     const handleOnline = async () => {
//       log('Network reconnected, waiting for stable connection...');
//       await waitForOnline();
//       log('Connection stable, performing sync...');
//       await performSync();
//     };
    
//     window.addEventListener('online', handleOnline);
    
//     return () => {
//       window.removeEventListener('online', handleOnline);
//     };
//   }, [opts.syncOnReconnect, performSync, log]);
  
//   /**
//    * Sync on mount (startup)
//    */
//   useEffect(() => {
//     if (!opts.syncOnMount && !opts.importOnMount) return;
//     if (!user) return;
    
//     const initialize = async () => {
//       // Wait for network if offline
//       if (!isOnline()) {
//         log('Offline on mount, waiting for connection...');
//         await waitForOnline();
//       }
      
//       if (opts.importOnMount) {
//         log('Importing data on mount...');
//         await performImport();
//       } else if (opts.syncOnMount) {
//         log('Syncing on mount...');
//         await performSync();
//       }
//     };
    
//     // Small delay to ensure app is fully loaded
//     const timer = setTimeout(initialize, 1000);
    
//     return () => clearTimeout(timer);
//   }, [opts.syncOnMount, opts.importOnMount, user, performSync, performImport, log]);
  
//   /**
//    * Periodic sync
//    */
//   useEffect(() => {
//     if (!opts.periodicSync || !user) return;
    
//     const intervalMs = opts.syncInterval * 60 * 1000; // Convert minutes to milliseconds
    
//     syncIntervalRef.current = setInterval(() => {
//       if (isOnline() && !isSyncingRef.current) {
//         log(`Periodic sync (every ${opts.syncInterval} minutes)`);
//         performSync();
//       } else {
//         log('Skipping periodic sync (offline or sync in progress)');
//       }
//     }, intervalMs);
    
//     log(`Periodic sync enabled (every ${opts.syncInterval} minutes)`);
    
//     return () => {
//       if (syncIntervalRef.current) {
//         clearInterval(syncIntervalRef.current);
//         syncIntervalRef.current = null;
//       }
//     };
//   }, [opts.periodicSync, opts.syncInterval, user, performSync, log]);
  
//   /**
//    * Sync before page unload
//    */
//   useEffect(() => {
//     if (!opts.syncBeforeUnload || !user) return;
    
//     const handleBeforeUnload = () => {
//       // Only sync if there are pending changes and we're online
//       if (isOnline() && !isSyncingRef.current) {
//         // Use sendBeacon for reliable sync on page close
//         log('Syncing before page unload...');
        
//         // Note: sendBeacon doesn't support async, so we use navigator.sendBeacon
//         // For now, we'll use a synchronous approach or skip if not critical
//         // The periodic sync will catch up on next session
        
//         // For critical sync, you might want to show a confirmation dialog
//         // but that's usually annoying for users
//       }
//     };
    
//     // Use visibilitychange for better reliability
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'hidden' && isOnline() && !isSyncingRef.current) {
//         log('Page hidden, performing sync...');
//         // Use sendBeacon or fetch with keepalive
//         performSync().catch(err => {
//           log('Background sync failed:', err);
//         });
//       }
//     };
    
//     window.addEventListener('beforeunload', handleBeforeUnload);
//     document.addEventListener('visibilitychange', handleVisibilityChange);
    
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [opts.syncBeforeUnload, user, performSync, log]);
  
//   return {
//     performSync,
//     performImport,
//     isSyncing: isSyncingRef.current,
//     lastSyncTime: lastSyncTimeRef.current,
//   };
// }


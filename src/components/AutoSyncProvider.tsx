"use client";

import { useAutoSync } from '@/hooks/useAutoSync';
import { toast } from 'sonner';

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
    debug: process.env.NODE_ENV === 'development', // Show logs in dev mode
    onSyncStart: () => {
      // Optional: Show loading indicator
      console.log('🔄 Syncing...');
    },
    onSyncComplete: (success, results) => {
      // Optional: Show success/error notification
      if (success) {
         console.log('Data synced successfully');
      } else {
         // Parse results to find what failed
         const failures: string[] = [];
         if (results) {
           Object.entries(results).forEach(([key, result]: [string, any]) => {
             if (result.status === 'rejected') {
               // Extract actual error message from rejection
               const errorMsg = result.reason?.message || result.reason?.toString() || 'Network/Server Error';
               failures.push(`${key}: ${errorMsg}`);
               console.error(`❌ ${key} sync rejected:`, result.reason);
             } else if (result.value?.failCount > 0) {
               // Extract error from the result value if available
               const errorDetail = result.value?.error || result.value?.results?.find((r: any) => !r.success)?.error || 'Unknown';
               failures.push(`${key}: ${result.value.failCount} failed (${errorDetail})`);
               console.error(`⚠️ ${key} partial failure:`, result.value);
             }
           });
         }
         
         const errorMessage = failures.length > 0 
           ? `Sync issues:\n${failures.join('\n')}`
           : 'Sync completed with errors';
         
         // Log full details to console for debugging
         console.error('📋 Full sync results:', results);
           
         toast.error(errorMessage, { duration: 8000 });
      }
    },
    onSyncError: (error) => {
      // Optional: Log or show error
      console.error('Auto-sync error:', error);
      toast.error(`Sync error: ${error.message}`);
    },
  });
  
  // Don't render anything, just enable auto-sync
  return null;
}


// "use client";

// import { useAutoSync } from '@/hooks/useAutoSync';

// /**
//  * Provider component that enables auto-sync for the entire app
//  * Add this to your root layout or dashboard pages
//  * 
//  * @example
//  * ```tsx
//  * // In layout.tsx or page.tsx
//  * <AutoSyncProvider />
//  * ```
//  */
// export function AutoSyncProvider() {
  
//   // Auto-sync configuration
//   useAutoSync({
//     syncOnMount: true, // Sync local changes on app startup
//     periodicSync: true, // Sync every 5 minutes
//     syncInterval: 5, // 5 minutes
//     syncOnReconnect: true, // Sync when network reconnects
//     syncBeforeUnload: true, // Sync before page closes
//     importOnMount: false, // Don't import on mount (only sync local changes)
//     debug: process.env.NODE_ENV === 'development', // Show logs in dev mode
//     onSyncStart: () => {
//       // Optional: Show loading indicator
//       // console.log('🔄 Syncing...');
//     },
//     onSyncComplete: (success) => {
//       // Optional: Show success/error notification
//       if (success) {
//         // toast.success('Data synced successfully');
//       } else {
//         // toast.error('Sync completed with errors');
//       }
//     },
//     onSyncError: (error) => {
//       // Optional: Log or show error
//       console.error('Auto-sync error:', error);
//     },
//   });
  
//   // Don't render anything, just enable auto-sync
//   return null;
// }


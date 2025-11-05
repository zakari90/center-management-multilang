/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generic syncable item interface
 * Uses syncStatus to match existing codebase pattern
 * Status values:
 * - 'synced' = successfully saved to server
 * - 'pending' = waiting to sync to server
 * - 'pending_delete' = marked for deletion, will be removed on next sync
 * - 'failed' = sync failed (optional, from existing system)
 */
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'pending_delete';

export interface SyncableItem {
  id?: string;
  syncStatus?: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // Allow additional fields for different item types
}

/**
 * Type guard to check if an object is a SyncableItem
 */
export function isSyncableItem(item: any): item is SyncableItem {
  return (
    item &&
    typeof item === 'object' &&
    item.createdAt instanceof Date &&
    item.updatedAt instanceof Date
  );
}


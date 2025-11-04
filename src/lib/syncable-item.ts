/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generic syncable item interface
 * Status values:
 * - "1" = synced (successfully saved to server)
 * - "w" = waiting (pending sync to server)
 * - "0" = pending delete (marked for deletion, will be removed on next sync)
 */
export interface SyncableItem {
  id?: string;
  status: '1' | 'w' | '0';
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
    (item.status === '1' || item.status === 'w' || item.status === '0') &&
    item.createdAt instanceof Date &&
    item.updatedAt instanceof Date
  );
}


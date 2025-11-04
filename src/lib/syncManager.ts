/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SyncManager - Unified sync system that handles both waiting (w) and pending delete (0) items
 * Coordinates between DexieActions (local) and ServerAction (network)
 */
import { DexieActions } from './dexieActions';
import { ServerAction } from './serverAction';
import { SyncableItem } from './syncable-item';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  deleted: number;
  errors: string[];
}

/**
 * SyncManager - Handles sync operations
 */
export class SyncManager {
  /**
   * Sync all pending items (waiting "w" and pending delete "0")
   * This is the main sync function that should be called manually or automatically
   */
  static async syncAll(apiEndpoint: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      deleted: 0,
      errors: []
    };

    if (!ServerAction.isOnline()) {
      result.success = false;
      result.errors.push('Offline - cannot sync');
      return result;
    }

    // Sync waiting items (status "w") - POST to server
    const waitingItems = await DexieActions.getWaitingItems();
    for (const item of waitingItems) {
      try {
        const response = await ServerAction.createItem(
          apiEndpoint,
          // Remove status and timestamps from data sent to server
          Object.fromEntries(
            Object.entries(item).filter(
              ([key]) => !['id', 'status', 'createdAt', 'updatedAt'].includes(key)
            )
          ) as any
        );

        if (response.success && response.data) {
          // Update local item with server ID and mark as synced
          if (item.id?.startsWith('temp_')) {
            // Replace temp ID with server ID
            await DexieActions.updateItemId(item.id, response.data.id || item.id);
          } else {
            // Update status to synced
            await DexieActions.updateItemStatus(item.id!, '1');
            if (response.data.id && response.data.id !== item.id) {
              // Server returned different ID, update it
              await DexieActions.updateItemId(item.id, response.data.id);
            }
          }
          result.synced++;
        } else {
          result.failed++;
          result.errors.push(`Failed to sync item ${item.id}: ${response.error || 'Unknown error'}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error syncing item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Sync pending delete items (status "0") - DELETE from server
    const pendingDeleteItems = await DexieActions.getPendingDeleteItems();
    for (const item of pendingDeleteItems) {
      if (!item.id) {
        // No ID means it was never synced, skip it
        continue;
      }

      // Skip if it's a temp ID (never synced)
      if (item.id.startsWith('temp_')) {
        await DexieActions.deleteItem(item.id);
        result.deleted++;
        continue;
      }

      try {
        const response = await ServerAction.deleteItem(apiEndpoint, item.id);

        if (response.success) {
          // Delete succeeded, remove from local DB
          await DexieActions.deleteItem(item.id);
          result.deleted++;
        } else {
          result.failed++;
          result.errors.push(`Failed to delete item ${item.id}: ${response.error || 'Unknown error'}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error deleting item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * Get sync status summary
   */
  static async getSyncStatus(): Promise<{
    synced: number;
    waiting: number;
    pendingDelete: number;
    total: number;
  }> {
    const counts = await DexieActions.getStatusCounts();
    return {
      ...counts,
      total: counts.synced + counts.waiting + counts.pendingDelete
    };
  }
}

/**
 * High-level function to add/edit an item with automatic sync handling
 * This implements the online-optimistic flow:
 * 1. Try server first
 * 2. On success: create with status "1"
 * 3. On failure: create with status "w"
 */
export async function addOrEditItem(
  apiEndpoint: string,
  data: Omit<SyncableItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  itemId?: string
): Promise<SyncableItem> {
  // Try server first
  try {
    let response;
    if (itemId) {
      // Update existing item
      response = await ServerAction.updateItem(apiEndpoint, itemId, data);
    } else {
      // Create new item
      response = await ServerAction.createItem(apiEndpoint, data);
    }

    if (response.success && response.data) {
      // Server save succeeded - update or create with status "1" (synced)
      if (itemId) {
        // Update existing item
        const existing = await DexieActions.getItem(itemId);
        if (existing) {
          // Update existing item with server data and mark as synced
          await DexieActions.updateItem(itemId, {
            ...response.data,
            status: '1'
          });
          return (await DexieActions.getItem(itemId))!;
        }
      }
      // Create new item with status "1" (synced)
      const item = await DexieActions.createItemSynced(
        response.data,
        response.data.id
      );
      return item;
    } else {
      // Server returned error (not network error)
      throw new Error(response.error || 'Server error');
    }
  } catch (error) {
    // Network error or offline - save locally with status "w"
    if (ServerAction.isNetworkError(error) || !ServerAction.isOnline()) {
      if (itemId) {
        // Update existing item
        const existing = await DexieActions.getItem(itemId);
        if (existing) {
          await DexieActions.updateItem(itemId, { ...data, status: 'w' });
          return (await DexieActions.getItem(itemId))!;
        }
      }
      // Create new item with status "w"
      return await DexieActions.createItemWaiting(data);
    }
    // Re-throw non-network errors
    throw error;
  }
}

/**
 * High-level function to delete an item with automatic sync handling
 * - If status "w": delete locally immediately
 * - If status "1": mark as "0" (pending delete)
 */
export async function deleteItem(
  apiEndpoint: string,
  itemId: string
): Promise<void> {
  const item = await DexieActions.getItem(itemId);
  if (!item) {
    throw new Error('Item not found');
  }

  if (item.status === 'w') {
    // Never synced - delete immediately
    await DexieActions.deleteItem(itemId);
  } else if (item.status === '1') {
    // Already synced - mark for deletion
    await DexieActions.markForDeletion(itemId);
    
    // Try to delete on server immediately if online
    if (ServerAction.isOnline()) {
      try {
        await ServerAction.deleteItem(apiEndpoint, itemId);
        // If successful, delete locally
        await DexieActions.deleteItem(itemId);
      } catch {
        // If it fails, it will be synced later
        // Item is already marked as "0", so it's fine
      }
    }
  } else if (item.status === '0') {
    // Already marked for deletion - do nothing or delete immediately
    await DexieActions.deleteItem(itemId);
  }
}


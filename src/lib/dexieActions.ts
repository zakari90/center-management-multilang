/**
 * DexieActions - Manages local IndexedDB operations with status tracking
 * Handles all CRUD operations on syncable items with status management
 */
import Dexie, { Table } from 'dexie';
import { SyncableItem, SyncStatus } from './syncable-item';

// Generic syncable items table
type SyncableItemTable = Table<SyncableItem, string>;

class SyncableItemsDB extends Dexie {
  items!: SyncableItemTable;

  constructor() {
    super('SyncableItemsDB');
    this.version(1).stores({
      items: 'id, syncStatus, createdAt, updatedAt'
    });
  }
}

const db = new SyncableItemsDB();

/**
 * Generate a temporary ID for offline items
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * DexieActions - All IndexedDB operations
 */
export class DexieActions {
  /**
   * Get all items (both synced and waiting)
   * Excludes pending delete items (syncStatus 'pending_delete')
   */
  static async getAllItems(): Promise<SyncableItem[]> {
    return await db.items
      .where('syncStatus')
      .anyOf(['synced', 'pending'])
      .toArray();
  }

  /**
   * Get items by syncStatus
   */
  static async getItemsByStatus(status: SyncStatus): Promise<SyncableItem[]> {
    return await db.items
      .where('syncStatus')
      .equals(status)
      .toArray();
  }

  /**
   * Get a single item by ID
   */
  static async getItem(id: string): Promise<SyncableItem | undefined> {
    return await db.items.get(id);
  }

  /**
   * Create a new item with syncStatus 'pending' (waiting to sync)
   * This is called when server save fails
   */
  static async createItemWaiting(data: Omit<SyncableItem, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>): Promise<SyncableItem> {
    const now = new Date();
    const item: SyncableItem = {
      ...data,
      id: generateTempId(),
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await db.items.add(item);
    return item;
  }

  /**
   * Create a new item with syncStatus 'synced'
   * This is called when server save succeeds
   */
  static async createItemSynced(data: Omit<SyncableItem, 'syncStatus' | 'createdAt' | 'updatedAt'>, serverId?: string): Promise<SyncableItem> {
    const now = new Date();
    const item: SyncableItem = {
      ...data,
      id: serverId || data.id || generateTempId(),
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now
    };

    await db.items.add(item);
    return item;
  }

  /**
   * Update an existing item
   * Preserves the current status unless explicitly changed
   */
  static async updateItem(id: string, updates: Partial<Omit<SyncableItem, 'id' | 'createdAt'>>): Promise<void> {
    await db.items.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Update item syncStatus
   */
  static async updateItemStatus(id: string, status: SyncStatus): Promise<void> {
    await db.items.update(id, {
      syncStatus: status,
      updatedAt: new Date()
    });
  }

  /**
   * Delete an item immediately
   * Used for items with syncStatus 'pending' (never synced)
   */
  static async deleteItem(id: string): Promise<void> {
    await db.items.delete(id);
  }

  /**
   * Mark item as pending delete (syncStatus 'pending_delete')
   * Used for items with syncStatus 'synced' (already synced)
   */
  static async markForDeletion(id: string): Promise<void> {
    await db.items.update(id, {
      syncStatus: 'pending_delete',
      updatedAt: new Date()
    });
  }

  /**
   * Get all items waiting to sync (syncStatus 'pending')
   */
  static async getWaitingItems(): Promise<SyncableItem[]> {
    return await this.getItemsByStatus('pending');
  }

  /**
   * Get all items pending delete (syncStatus 'pending_delete')
   */
  static async getPendingDeleteItems(): Promise<SyncableItem[]> {
    return await this.getItemsByStatus('pending_delete');
  }

  /**
   * Remove all pending delete items (syncStatus 'pending_delete')
   * Called after successful sync
   */
  static async removePendingDeletes(): Promise<void> {
    await db.items.where('syncStatus').equals('pending_delete').delete();
  }

  /**
   * Update item from temp ID to server ID after sync
   */
  static async updateItemId(tempId: string, serverId: string): Promise<void> {
    const item = await db.items.get(tempId);
    if (item) {
      await db.items.delete(tempId);
      await db.items.add({
        ...item,
        id: serverId,
        syncStatus: 'synced',
        updatedAt: new Date()
      });
    }
  }

  /**
   * Get count of items by syncStatus
   */
  static async getStatusCounts(): Promise<{ synced: number; waiting: number; pendingDelete: number }> {
    const [synced, waiting, pendingDelete] = await Promise.all([
      db.items.where('syncStatus').equals('synced').count(),
      db.items.where('syncStatus').equals('pending').count(),
      db.items.where('syncStatus').equals('pending_delete').count()
    ]);

    return { synced, waiting, pendingDelete };
  }
}


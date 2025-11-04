/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DexieActions - Manages local IndexedDB operations with status tracking
 * Handles all CRUD operations on syncable items with status management
 */
import Dexie, { Table } from 'dexie';
import { SyncableItem } from './syncable-item';

// Generic syncable items table
interface SyncableItemTable extends Table<SyncableItem, string> {}

class SyncableItemsDB extends Dexie {
  items!: SyncableItemTable;

  constructor() {
    super('SyncableItemsDB');
    this.version(1).stores({
      items: 'id, status, createdAt, updatedAt'
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
   * Excludes pending delete items (status "0")
   */
  static async getAllItems(): Promise<SyncableItem[]> {
    return await db.items
      .where('status')
      .anyOf(['1', 'w'])
      .toArray();
  }

  /**
   * Get items by status
   */
  static async getItemsByStatus(status: '1' | 'w' | '0'): Promise<SyncableItem[]> {
    return await db.items
      .where('status')
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
   * Create a new item with status "w" (waiting to sync)
   * This is called when server save fails
   */
  static async createItemWaiting(data: Omit<SyncableItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SyncableItem> {
    const now = new Date();
    const item: SyncableItem = {
      ...data,
      id: generateTempId(),
      status: 'w',
      createdAt: now,
      updatedAt: now
    };

    await db.items.add(item);
    return item;
  }

  /**
   * Create a new item with status "1" (synced)
   * This is called when server save succeeds
   */
  static async createItemSynced(data: Omit<SyncableItem, 'status' | 'createdAt' | 'updatedAt'>, serverId?: string): Promise<SyncableItem> {
    const now = new Date();
    const item: SyncableItem = {
      ...data,
      id: serverId || data.id || generateTempId(),
      status: '1',
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
   * Update item status
   */
  static async updateItemStatus(id: string, status: '1' | 'w' | '0'): Promise<void> {
    await db.items.update(id, {
      status,
      updatedAt: new Date()
    });
  }

  /**
   * Delete an item immediately
   * Used for items with status "w" (never synced)
   */
  static async deleteItem(id: string): Promise<void> {
    await db.items.delete(id);
  }

  /**
   * Mark item as pending delete (status "0")
   * Used for items with status "1" (already synced)
   */
  static async markForDeletion(id: string): Promise<void> {
    await db.items.update(id, {
      status: '0',
      updatedAt: new Date()
    });
  }

  /**
   * Get all items waiting to sync (status "w")
   */
  static async getWaitingItems(): Promise<SyncableItem[]> {
    return await this.getItemsByStatus('w');
  }

  /**
   * Get all items pending delete (status "0")
   */
  static async getPendingDeleteItems(): Promise<SyncableItem[]> {
    return await this.getItemsByStatus('0');
  }

  /**
   * Remove all pending delete items (status "0")
   * Called after successful sync
   */
  static async removePendingDeletes(): Promise<void> {
    await db.items.where('status').equals('0').delete();
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
        status: '1',
        updatedAt: new Date()
      });
    }
  }

  /**
   * Get count of items by status
   */
  static async getStatusCounts(): Promise<{ synced: number; waiting: number; pendingDelete: number }> {
    const [synced, waiting, pendingDelete] = await Promise.all([
      db.items.where('status').equals('1').count(),
      db.items.where('status').equals('w').count(),
      db.items.where('status').equals('0').count()
    ]);

    return { synced, waiting, pendingDelete };
  }
}


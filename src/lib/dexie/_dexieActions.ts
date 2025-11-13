/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from 'dexie';
import { SyncEntity, localDb } from './dbSchema';

export interface SyncTargets<T> {
  waiting: T[];
  pending: T[];
}

export interface DexieActions<T extends SyncEntity> {
  // Core CRUD
  putLocal: (item: T) => Promise<string>;
  bulkPutLocal: (items: T[]) => Promise<string[]>;
  getAll: () => Promise<T[]>;
  getByStatus: (statuses: ('1' | 'w' | '0')[]) => Promise<T[]>;
  getLocal: (id: string) => Promise<T | undefined>;
  bulkGetLocal: (ids: string[]) => Promise<(T | undefined)[]>;
  deleteLocal: (id: string) => Promise<void>;
  bulkDeleteLocal: (ids: string[]) => Promise<void>;
  
  // Soft delete operations
  markForDelete: (id: string) => Promise<void>;
  bulkMarkForDelete: (ids: string[]) => Promise<void>;
  
  // Sync operations
  markSynced: (id: string) => Promise<void>;
  bulkMarkSynced: (ids: string[]) => Promise<void>;
  getSyncTargets: () => Promise<SyncTargets<T>>;
  getPendingSync: () => Promise<T[]>;
  
  // Optional: Email lookup (only for tables with email field)
  getLocalByEmail?: (email: string) => Promise<T | undefined>;
}

export function generateDexieActions<T extends SyncEntity>(
  table: Table<T>,
  hasEmailField = false
): DexieActions<T> {
  
  const actions: DexieActions<T> = {
    // Single put - use for individual operations
    putLocal: async (item: T): Promise<string> => {
      const key = await table.put(item);
      return key as string;
    },
    
    // Bulk put - much faster for multiple items
    bulkPutLocal: async (items: T[]): Promise<string[]> => {
      if (items.length === 0) return [];
      const keys = await table.bulkPut(items, { allKeys: true });
      return keys as string[];
    },
    
    // Get all sorted by most recent first
    getAll: async (): Promise<T[]> => {
      return await table
        .orderBy('updatedAt')
        .reverse()
        .toArray();
    },
    
    // Get by sync status - with proper type safety
    getByStatus: async (statuses: ('1' | 'w' | '0')[]): Promise<T[]> => {
      return await table
        .where('status')
        .anyOf(statuses)
        .toArray();
    },
    
    // Single get by primary key - fastest lookup method
    getLocal: async (id: string): Promise<T | undefined> => {
      return await table.get(id);
    },
    
    // Bulk get - for fetching multiple records efficiently
    bulkGetLocal: async (ids: string[]): Promise<(T | undefined)[]> => {
      if (ids.length === 0) return [];
      return await table.bulkGet(ids);
    },
    
    // Hard delete - permanently removes record
    deleteLocal: async (id: string): Promise<void> => {
      await table.delete(id);
    },
    
    // Bulk hard delete
    bulkDeleteLocal: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      await table.bulkDelete(ids);
    },
    
    // Soft delete - marks for deletion, pending server sync
    markForDelete: async (id: string): Promise<void> => {
      await table.update(id, { 
        status: '0',
        updatedAt: Date.now() 
      } as any);
    },
    
    // Bulk soft delete - more efficient than loop
    bulkMarkForDelete: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      const updates = ids.map(id => ({
        key: id,
        changes: { 
          status: '0',
          updatedAt: Date.now() 
        } as any
      }));
      await table.bulkUpdate(updates);
    },
    
    // Mark as synced with server
    markSynced: async (id: string): Promise<void> => {
      await table.update(id, { 
        status: '1',
        updatedAt: Date.now() 
      } as any);
    },
    
    // Bulk mark synced - critical for sync performance
    bulkMarkSynced: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      const updates = ids.map(id => ({
        key: id,
        changes: { 
          status: '1',
          updatedAt: Date.now() 
        } as any
      }));
      await table.bulkUpdate(updates);
    },
    
    // Get all pending and waiting items for sync
    getSyncTargets: async (): Promise<SyncTargets<T>> => {
      // Use compound index [status+updatedAt] for optimal performance
      const waiting = await table
        .where('[status+updatedAt]')
        .between(['w', 0], ['w', Date.now() + 1])
        .toArray();
      
      const pending = await table
        .where('[status+updatedAt]')
        .between(['0', 0], ['0', Date.now() + 1])
        .toArray();
      
      return { waiting, pending };
    },
    
    // Get all records needing sync (both waiting and pending)
    getPendingSync: async (): Promise<T[]> => {
      return await table
        .where('status')
        .anyOf(['w', '0'])
        .sortBy('updatedAt'); // Oldest first for sync fairness
    },
  };
  
  // Conditionally add email lookup for tables that have email field
  if (hasEmailField) {
    actions.getLocalByEmail = async (email: string): Promise<T | undefined> => {
      // Uses unique index on email for fast lookup
      return await table.where('email').equals(email).first();
    };
  }
  
  return actions;
}

// Export all entity actions with proper email field flags
export const centerActions = generateDexieActions(localDb.centers);
export const userActions = generateDexieActions(localDb.users, true); // has email
export const teacherActions = generateDexieActions(localDb.teachers, true); // has email
export const studentActions = generateDexieActions(localDb.students, true); // has email
export const subjectActions = generateDexieActions(localDb.subjects);
export const teacherSubjectActions = generateDexieActions(localDb.teacherSubjects);
export const studentSubjectActions = generateDexieActions(localDb.studentSubjects);
export const receiptActions = generateDexieActions(localDb.receipts);
export const scheduleActions = generateDexieActions(localDb.schedules);
export const pushSubscriptionActions = generateDexieActions(localDb.pushSubscriptions);

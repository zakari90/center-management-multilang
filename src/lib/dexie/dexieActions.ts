/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from 'dexie';
import { SyncEntity, localDb } from './dbSchema';

export interface SyncTargets<T> {
  waiting: T[];
  pending: T[];
}

export interface DexieActions<T extends SyncEntity> {
  putLocal: (item: T) => Promise<string>;
  getAll: () => Promise<T[]>;
  getByStatus: (statuses: string[]) => Promise<T[]>;
  getLocal: (id: string) => Promise<T | undefined>;
  deleteLocal: (id: string) => Promise<void>;
  markForDelete: (id: string) => Promise<void>;
  markSynced: (id: string) => Promise<void>;
  getSyncTargets: () => Promise<SyncTargets<T>>;
  getLocalByEmail?: (email: string) => Promise<T | undefined>;
}

export function generateDexieActions<T extends SyncEntity>(
  table: Table<T>,
  hasEmailField = false
): DexieActions<T> {
  const actions: DexieActions<T> = {
    putLocal: async (item: T): Promise<string> => {
      const key = await table.put(item);
      return key as string;
    },
    
    getAll: async (): Promise<T[]> => {
      return await table
        .orderBy('updatedAt')
        .reverse()
        .toArray();
    },
    
    getByStatus: async (statuses: string[]): Promise<T[]> => {
      return await table
        .where('status')
        .anyOf(statuses)
        .toArray();
    },
    
    // ✅ Use direct .get() for primary key - 10-100x faster
    getLocal: async (id: string): Promise<T | undefined> => {
      return await table.get(id);
    },
    
    // ✅ Use direct .delete() for primary key
    deleteLocal: async (id: string): Promise<void> => {
      await table.delete(id);
    },
    
    // ✅ Use .update() instead of .modify() for single records
    markForDelete: async (id: string): Promise<void> => {
      await table.update(id, { 
        status: '0',
        updatedAt: Date.now() 
      } as any);
    },
    
    markSynced: async (id: string): Promise<void> => {
      await table.update(id, { 
        status: '1',
        updatedAt: Date.now() 
      } as any);
    },
    
    // ✅ Use compound index for better performance
    getSyncTargets: async (): Promise<SyncTargets<T>> => {
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
  };
  
  // Only add email lookup if table has email field
  if (hasEmailField) {
    actions.getLocalByEmail = async (email: string): Promise<T | undefined> => {
      return await table.where('email').equals(email).first();
    };
  }
  
  return actions;
}

// Export with correct email flags
export const centerActions = generateDexieActions(localDb.centers, false);
export const userActions = generateDexieActions(localDb.users, true);
export const teacherActions = generateDexieActions(localDb.teachers, true);
export const studentActions = generateDexieActions(localDb.students, true);
export const subjectActions = generateDexieActions(localDb.subjects, false);
export const teacherSubjectActions = generateDexieActions(localDb.teacherSubjects, false);
export const studentSubjectActions = generateDexieActions(localDb.studentSubjects, false);
export const receiptActions = generateDexieActions(localDb.receipts, false);
export const scheduleActions = generateDexieActions(localDb.schedules, false);
export const pushSubscriptionActions = generateDexieActions(localDb.pushSubscriptions, false);

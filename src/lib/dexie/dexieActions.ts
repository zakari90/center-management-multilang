import { Table } from 'dexie';
import { SyncEntity, localDb } from './dbSchema';

export interface SyncTargets<T> {
  waiting: T[];
  pending: T[];
}

export interface DexieActions<T extends SyncEntity> {
  putLocal: (item: T) => Promise<string>;
  getAll: () => Promise<T[]>;
  getLocal: (id: string) => Promise<T | undefined>;
  deleteLocal: (id: string) => Promise<number>;
  markForDelete: (id: string) => Promise<number>;
  getLocalByEmail: (email: string) => Promise<T | undefined>;
  markSynced: (id: string) => Promise<number>;
  getSyncTargets: () => Promise<SyncTargets<T>>;
}

export function generateDexieActions<T extends SyncEntity>(
  table: Table<T>
): DexieActions<T> {
  return {
    putLocal: async (item: T): Promise<string> => {
      const key = await table.put(item);
      return key as string;
    },
    
    getAll: async (): Promise<T[]> => {
      return await table.orderBy('updatedAt').reverse().toArray();
    },
    
    getLocal: async (id: string): Promise<T | undefined> => {
      return await table.where('id').equals(id).first();
    },
    
    getLocalByEmail: async (email: string): Promise<T | undefined> => {
      return await table.where('email').equals(email).first();
    },
    
    deleteLocal: async (id: string): Promise<number> => {
      return await table.where('id').equals(id).delete();
    },
    
    markForDelete: async (id: string): Promise<number> => {
      return await table.where('id').equals(id).modify((obj) => {
        obj.status = '0';
        obj.updatedAt = Date.now();
      });
    },
    
    markSynced: async (id: string): Promise<number> => {
      return await table.where('id').equals(id).modify((obj) => {
        obj.status = '1';
      });
    },
    
    getSyncTargets: async (): Promise<SyncTargets<T>> => {
      const waiting = await table.where('status').equals('w').toArray();
      const pending = await table.where('status').equals('0').toArray();
      return { waiting, pending };
    },
  };
}

// Export all entity actions
export const userActions = generateDexieActions(localDb.users);
export const centerActions = generateDexieActions(localDb.centers);
export const teacherActions = generateDexieActions(localDb.teachers);
export const studentActions = generateDexieActions(localDb.students);
export const subjectActions = generateDexieActions(localDb.subjects);
export const teacherSubjectActions = generateDexieActions(localDb.teacherSubjects);
export const studentSubjectActions = generateDexieActions(localDb.studentSubjects);
export const receiptActions = generateDexieActions(localDb.receipts);
export const scheduleActions = generateDexieActions(localDb.schedules);
export const pushSubscriptionActions = generateDexieActions(localDb.pushSubscriptions);


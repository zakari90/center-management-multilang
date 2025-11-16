/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from 'dexie';
import { SyncEntity, localDb } from './dbSchema';

export interface SyncTargets<T> {
  waiting: T[];
  pending: T[];
}

export interface DexieActions<T extends SyncEntity> {
  putLocal: (item: T) => Promise<string>;
  bulkPutLocal: (items: T[]) => Promise<string[]>;
  getAll: () => Promise<T[]>;
  getByStatus: (statuses: string[]) => Promise<T[]>;
  getLocal: (id: string) => Promise<T | undefined>;
  deleteLocal: (id: string) => Promise<void>;
  bulkDeleteLocal: (ids: string[]) => Promise<void>;
  markForDelete: (id: string) => Promise<void>;
  markSynced: (id: string) => Promise<void>;
  bulkMarkSynced: (ids: string[]) => Promise<void>;
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
    
    // ✅ Optimized bulk insert - 10-100x faster than individual puts
    bulkPutLocal: async (items: T[]): Promise<string[]> => {
      if (items.length === 0) return [];
      const keys = await table.bulkPut(items, { allKeys: true });
      return keys as string[];
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
    
    getLocal: async (id: string): Promise<T | undefined> => {
      return await table.get(id);
    },
    
    deleteLocal: async (id: string): Promise<void> => {
      await table.delete(id);
    },
    
    // ✅ Bulk delete - much faster for cascade operations
    bulkDeleteLocal: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      await table.bulkDelete(ids);
    },
    
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
    
    // ✅ Bulk mark synced for batch sync operations
    bulkMarkSynced: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      const now = Date.now();
      await Promise.all(
        ids.map(id => table.update(id, { 
          status: '1',
          updatedAt: now 
        } as any))
      );
    },
    
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
  
  if (hasEmailField) {
    actions.getLocalByEmail = async (email: string): Promise<T | undefined> => {
      return await table.where('email').equals(email).first();
    };
  }
  
  return actions;
}

// Export actions
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

// ✅ Cascade delete helper for center with all related entities
export async function deleteCenterWithRelations(centerId: string): Promise<void> {
  const subjects = await subjectActions.getAll();
  const centerSubjects = subjects.filter(s => s.centerId === centerId);
  const subjectIds = centerSubjects.map(s => s.id);
  
  // Get all related entities that reference these subjects
  const schedules = await scheduleActions.getAll();
  const teacherSubjects = await teacherSubjectActions.getAll();
  const studentSubjects = await studentSubjectActions.getAll();
  
  const relatedScheduleIds = schedules
    .filter(s => s.centerId === centerId || subjectIds.includes(s.subjectId))
    .map(s => s.id);
  
  const relatedTeacherSubjectIds = teacherSubjects
    .filter(ts => subjectIds.includes(ts.subjectId))
    .map(ts => ts.id);
  
  const relatedStudentSubjectIds = studentSubjects
    .filter(ss => subjectIds.includes(ss.subjectId))
    .map(ss => ss.id);
  
  // Mark everything for deletion in a single transaction
  await localDb.transaction('rw', [
    localDb.centers,
    localDb.subjects,
    localDb.schedules,
    localDb.teacherSubjects,
    localDb.studentSubjects
  ], async () => {
    await centerActions.markForDelete(centerId);
    await Promise.all(subjectIds.map(id => subjectActions.markForDelete(id)));
    await Promise.all(relatedScheduleIds.map(id => scheduleActions.markForDelete(id)));
    await Promise.all(relatedTeacherSubjectIds.map(id => teacherSubjectActions.markForDelete(id)));
    await Promise.all(relatedStudentSubjectIds.map(id => studentSubjectActions.markForDelete(id)));
  });
}

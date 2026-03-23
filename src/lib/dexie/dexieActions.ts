/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from "dexie";
import { SyncEntity, localDb } from "./dbSchema";
import { encryptEntity, decryptEntity } from "../utils/encryptionEngine";

export interface SyncTargets<T> {
  waiting: T[];
  pending: T[];
}

export interface DexieActions<T extends SyncEntity> {
  putLocal: (item: T) => Promise<string>;
  bulkPutLocal: (items: T[]) => Promise<string[]>;
  create: (item: T) => Promise<string>;
  update: (id: string, changes: Partial<T>) => Promise<number>;
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
  hasEmailField = false,
  shouldEncrypt = true,
): DexieActions<T> {
  const encryptItem = shouldEncrypt
    ? async (item: T) => (await encryptEntity(item)) as T
    : async (item: T) => item;
  const decryptItem = shouldEncrypt
    ? async (item: T) => (await decryptEntity(item)) as T
    : async (item: T) => item;

  const actions: DexieActions<T> = {
    putLocal: async (item: T): Promise<string> => {
      const encryptedItem = await encryptItem(item);
      const key = await table.put(encryptedItem);
      return key as string;
    },

    create: async (item: T): Promise<string> => {
      const encryptedItem = await encryptItem(item);
      const key = await table.add(encryptedItem);
      return key as string;
    },

    update: async (id: string, changes: Partial<T>): Promise<number> => {
      // Must decrypt current, merge changes, then re-encrypt to maintain data integrity
      const current = await table.get(id);
      if (!current) return 0;
      const decryptedCurrent = await decryptItem(current);
      const merged = { ...decryptedCurrent, ...changes };
      const encryptedMerged = await encryptItem(merged as T);
      return (await table.put(encryptedMerged)) ? 1 : 0;
    },

    // ✅ Optimized bulk insert - 10-100x faster than individual puts
    bulkPutLocal: async (items: T[]): Promise<string[]> => {
      if (items.length === 0) return [];
      const encryptedItems = await Promise.all(
        items.map((i) => encryptItem(i)),
      );
      const keys = await table.bulkPut(encryptedItems, { allKeys: true });
      return keys as string[];
    },

    getAll: async (): Promise<T[]> => {
      const records = await table.orderBy("updatedAt").reverse().toArray();
      return Promise.all(records.map((r) => decryptItem(r)));
    },

    getByStatus: async (statuses: string[]): Promise<T[]> => {
      const records = await table.where("status").anyOf(statuses).toArray();
      return Promise.all(records.map((r) => decryptItem(r)));
    },

    getLocal: async (id: string): Promise<T | undefined> => {
      const record = await table.get(id);
      if (!record) return undefined;
      return await decryptItem(record);
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
        status: "0",
        updatedAt: Date.now(),
      } as any);
    },

    markSynced: async (id: string): Promise<void> => {
      await table.update(id, {
        status: "1",
        updatedAt: Date.now(),
      } as any);
    },

    // ✅ Bulk mark synced for batch sync operations
    bulkMarkSynced: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      const now = Date.now();
      await Promise.all(
        ids.map((id) =>
          table.update(id, {
            status: "1",
            updatedAt: now,
          } as any),
        ),
      );
    },

    getSyncTargets: async (): Promise<SyncTargets<T>> => {
      const waiting = await table
        .where("[status+updatedAt]")
        .between(["w", 0], ["w", Date.now() + 1])
        .toArray();

      const pending = await table
        .where("[status+updatedAt]")
        .between(["0", 0], ["0", Date.now() + 1])
        .toArray();

      return {
        waiting: await Promise.all(waiting.map((r) => decryptItem(r))),
        pending: await Promise.all(pending.map((r) => decryptItem(r))),
      };
    },
  };

  if (hasEmailField) {
    actions.getLocalByEmail = async (email: string): Promise<T | undefined> => {
      const record = await table.where("email").equals(email).first();
      if (!record) return undefined;
      return await decryptItem(record);
    };
  }

  return actions;
}

// Export actions
export const centerActions = generateDexieActions(localDb.centers, false, true);
export const userActions = generateDexieActions(localDb.users, true, false); // No encryption on Users
export const teacherActions = generateDexieActions(
  localDb.teachers,
  true,
  true,
);
export const studentActions = generateDexieActions(
  localDb.students,
  true,
  true,
);
export const subjectActions = generateDexieActions(
  localDb.subjects,
  false,
  true,
);
export const teacherSubjectActions = generateDexieActions(
  localDb.teacherSubjects,
  false,
  true,
);
export const studentSubjectActions = generateDexieActions(
  localDb.studentSubjects,
  false,
  true,
);
export const receiptActions = generateDexieActions(
  localDb.receipts,
  false,
  true,
);
export const scheduleActions = generateDexieActions(
  localDb.schedules,
  false,
  true,
);
export const pushSubscriptionActions = generateDexieActions(
  localDb.pushSubscriptions,
  false,
  false,
);
export const deleteRequestActions = generateDexieActions(
  localDb.deleteRequests,
  false,
  true,
);
export const appNotificationActions = generateDexieActions(
  localDb.appNotifications,
  false,
  false,
);

// ✅ Cascade delete helper for center with all related entities
export async function deleteCenterWithRelations(
  centerId: string,
): Promise<void> {
  const subjects = await subjectActions.getAll();
  const centerSubjects = subjects.filter((s) => s.centerId === centerId);
  const subjectIds = centerSubjects.map((s) => s.id);

  // Get all related entities that reference these subjects
  const schedules = await scheduleActions.getAll();
  const teacherSubjects = await teacherSubjectActions.getAll();
  const studentSubjects = await studentSubjectActions.getAll();

  const relatedScheduleIds = schedules
    .filter((s) => s.centerId === centerId || subjectIds.includes(s.subjectId))
    .map((s) => s.id);

  const relatedTeacherSubjectIds = teacherSubjects
    .filter((ts) => subjectIds.includes(ts.subjectId))
    .map((ts) => ts.id);

  const relatedStudentSubjectIds = studentSubjects
    .filter((ss) => subjectIds.includes(ss.subjectId))
    .map((ss) => ss.id);

  // Mark everything for deletion in a single transaction
  await localDb.transaction(
    "rw",
    [
      localDb.centers,
      localDb.subjects,
      localDb.schedules,
      localDb.teacherSubjects,
      localDb.studentSubjects,
    ],
    async () => {
      await centerActions.markForDelete(centerId);
      await Promise.all(
        subjectIds.map((id) => subjectActions.markForDelete(id)),
      );
      await Promise.all(
        relatedScheduleIds.map((id) => scheduleActions.markForDelete(id)),
      );
      await Promise.all(
        relatedTeacherSubjectIds.map((id) =>
          teacherSubjectActions.markForDelete(id),
        ),
      );
      await Promise.all(
        relatedStudentSubjectIds.map((id) =>
          studentSubjectActions.markForDelete(id),
        ),
      );
    },
  );
}

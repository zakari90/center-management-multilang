/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from "dexie";
import { BaseEntity, localDb } from "./dbSchema";

export interface freedexieaction<T extends BaseEntity> {
  putLocal: (item: T) => Promise<string>;
  bulkPutLocal: (items: T[]) => Promise<string[]>;
  create: (item: T) => Promise<string>;
  update: (id: string, changes: Partial<T>) => Promise<number>;
  getAll: () => Promise<T[]>;
  getLocal: (id: string) => Promise<T | undefined>;
  deleteLocal: (id: string) => Promise<void>;
  bulkDeleteLocal: (ids: string[]) => Promise<void>;
  getLocalByEmail?: (email: string) => Promise<T | undefined>;
}

/**
 * Factory to generate CRUD actions using a lazy table getter.
 * This ensures IndexedDB is NOT initialized until a method is called.
 */
export function generatefreedexieaction<T extends BaseEntity>(
  getTable: () => Table<T>,
  hasEmailField = false,
): freedexieaction<T> {
  const actions: freedexieaction<T> = {
    putLocal: async (item: T): Promise<string> => {
      const key = await getTable().put(item);
      return key as string;
    },

    create: async (item: T): Promise<string> => {
      const key = await getTable().add(item);
      return key as string;
    },

    update: async (id: string, changes: Partial<T>): Promise<number> => {
      return await getTable().update(id, changes as any);
    },

    bulkPutLocal: async (items: T[]): Promise<string[]> => {
      if (items.length === 0) return [];
      const keys = await getTable().bulkPut(items, { allKeys: true });
      return keys as string[];
    },

    getAll: async (): Promise<T[]> => {
      return await getTable().orderBy("updatedAt").reverse().toArray();
    },

    getLocal: async (id: string): Promise<T | undefined> => {
      return await getTable().get(id);
    },

    deleteLocal: async (id: string): Promise<void> => {
      await getTable().delete(id);
    },

    bulkDeleteLocal: async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      await getTable().bulkDelete(ids);
    },
  };

  if (hasEmailField) {
    actions.getLocalByEmail = async (email: string): Promise<T | undefined> => {
      return await getTable().where("email").equals(email).first();
    };
  }

  return actions;
}

// Export actions with lazy getters to prevent eager initialization
export const centerActions = generatefreedexieaction(() => localDb.centers, false);
export const userActions = generatefreedexieaction(() => localDb.users, true); 
export const teacherActions = generatefreedexieaction(() => localDb.teachers, true);
export const studentActions = generatefreedexieaction(() => localDb.students, true);
export const subjectActions = generatefreedexieaction(() => localDb.subjects, false);
export const teacherSubjectActions = generatefreedexieaction(() => localDb.teacherSubjects, false);
export const studentSubjectActions = generatefreedexieaction(() => localDb.studentSubjects, false);
export const receiptActions = generatefreedexieaction(() => localDb.receipts, false);
export const scheduleActions = generatefreedexieaction(() => localDb.schedules, false);

// ✅ Cascade delete helper for center with all related entities
export async function deleteCenterWithRelations(centerId: string): Promise<void> {
  const subjects = await subjectActions.getAll();
  const centerSubjects = subjects.filter((s) => s.centerId === centerId);
  const subjectIds = centerSubjects.map((s) => s.id);

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
      await centerActions.deleteLocal(centerId);
      await Promise.all(subjectIds.map((id) => subjectActions.deleteLocal(id)));
      await Promise.all(relatedScheduleIds.map((id) => scheduleActions.deleteLocal(id)));
      await Promise.all(relatedTeacherSubjectIds.map((id) => teacherSubjectActions.deleteLocal(id)));
      await Promise.all(relatedStudentSubjectIds.map((id) => studentSubjectActions.deleteLocal(id)));
    },
  );
}

/**
 * Clear all local entity data
 */
export async function clearAllLocalData(): Promise<void> {
  try {
    await Promise.all([
      localDb.centers.clear(),
      localDb.teachers.clear(),
      localDb.students.clear(),
      localDb.subjects.clear(),
      localDb.teacherSubjects.clear(),
      localDb.studentSubjects.clear(),
      localDb.receipts.clear(),
      localDb.schedules.clear(),
      localDb.users.clear(),
    ]);
  } catch (error) {
    console.error("[clearLocalData] Error clearing local data:", error);
    throw error;
  }
}

/**
 * Export all local data as JSON for backup
 */
export async function exportLocalDataAsJson(): Promise<{
  exportedAt: string;
  data: {
    centers: unknown[];
    teachers: unknown[];
    students: unknown[];
    subjects: unknown[];
    teacherSubjects: unknown[];
    studentSubjects: unknown[];
    receipts: unknown[];
    schedules: unknown[];
  };
}> {
  try {
    const [
      centers,
      teachers,
      students,
      subjects,
      teacherSubjects,
      studentSubjects,
      receipts,
      schedules,
    ] = await Promise.all([
      localDb.centers.toArray(),
      localDb.teachers.toArray(),
      localDb.students.toArray(),
      localDb.subjects.toArray(),
      localDb.teacherSubjects.toArray(),
      localDb.studentSubjects.toArray(),
      localDb.receipts.toArray(),
      localDb.schedules.toArray(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      data: {
        centers,
        teachers,
        students,
        subjects,
        teacherSubjects,
        studentSubjects,
        receipts,
        schedules,
      },
    };
  } catch (error) {
    console.error("[clearLocalData] Error exporting local data:", error);
    throw error;
  }
}

/**
 * Download the exported data as a JSON file
 */
export function downloadExportAsFile(data: object, filename?: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `local-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

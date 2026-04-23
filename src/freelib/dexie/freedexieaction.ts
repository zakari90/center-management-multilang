/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table } from "dexie";
import { BaseEntity, getDb } from "./dbSchema";

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
export const centerActions = generatefreedexieaction(() => getDb().centers, false);
export const userActions = generatefreedexieaction(() => getDb().users, true); 
export const teacherActions = generatefreedexieaction(() => getDb().teachers, true);
export const studentActions = generatefreedexieaction(() => getDb().students, true);
export const subjectActions = generatefreedexieaction(() => getDb().subjects, false);
export const teacherSubjectActions = generatefreedexieaction(() => getDb().teacherSubjects, false);
export const studentSubjectActions = generatefreedexieaction(() => getDb().studentSubjects, false);
export const receiptActions = generatefreedexieaction(() => getDb().receipts, false);
export const scheduleActions = generatefreedexieaction(() => getDb().schedules, false);

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

  await getDb().transaction(
    "rw",
    [
      getDb().centers,
      getDb().subjects,
      getDb().schedules,
      getDb().teacherSubjects,
      getDb().studentSubjects,
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
      getDb().centers.clear(),
      getDb().teachers.clear(),
      getDb().students.clear(),
      getDb().subjects.clear(),
      getDb().teacherSubjects.clear(),
      getDb().studentSubjects.clear(),
      getDb().receipts.clear(),
      getDb().schedules.clear(),
      getDb().users.clear(),
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
      getDb().centers.toArray(),
      getDb().teachers.toArray(),
      getDb().students.toArray(),
      getDb().subjects.toArray(),
      getDb().teacherSubjects.toArray(),
      getDb().studentSubjects.toArray(),
      getDb().receipts.toArray(),
      getDb().schedules.toArray(),
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

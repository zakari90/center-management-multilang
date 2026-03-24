/**
 * Clear Local Data Utility
 *
 * Clears all entity data from local IndexedDB when an epoch mismatch is detected.
 * This happens when the server data has been reset (e.g., admin deleted all data).
 */

import { localDb } from "./dbSchema";

/**
 * Clear all local entity data (keeps auth credentials and subscriptions)
 * Called when a data epoch mismatch is detected
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
      // Note: Keep localAuthUsers for offline login capability
      // Note: Keep syncMeta as it stores epoch info
    ]);
  } catch (error) {
    console.error("[clearLocalData] Error clearing local data:", error);
    throw error;
  }
}

/**
 * Check if there are any pending local changes that would be lost
 * Returns counts of pending records per table
 */
export async function getPendingChangesCount(): Promise<{
  total: number;
  details: Record<string, number>;
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
      localDb.centers.where("status").anyOf(["w", "0"]).count(),
      localDb.teachers.where("status").anyOf(["w", "0"]).count(),
      localDb.students.where("status").anyOf(["w", "0"]).count(),
      localDb.subjects.where("status").anyOf(["w", "0"]).count(),
      localDb.teacherSubjects.where("status").anyOf(["w", "0"]).count(),
      localDb.studentSubjects.where("status").anyOf(["w", "0"]).count(),
      localDb.receipts.where("status").anyOf(["w", "0"]).count(),
      localDb.schedules.where("status").anyOf(["w", "0"]).count(),
    ]);

    const details = {
      centers,
      teachers,
      students,
      subjects,
      teacherSubjects,
      studentSubjects,
      receipts,
      schedules,
    };

    const total = Object.values(details).reduce((sum, count) => sum + count, 0);

    return { total, details };
  } catch (error) {
    console.error(
      "[clearLocalData] Error getting pending changes count:",
      error,
    );
    return { total: 0, details: {} };
  }
}

/**
 * Update the sync metadata with the current epoch
 */
export async function updateSyncMeta(
  userId: string,
  dataEpoch: string,
): Promise<void> {
  try {
    await localDb.syncMeta.put({
      id: "current",
      userId,
      dataEpoch,
      lastSyncAt: Date.now(),
    });
  } catch (error) {
    console.error("[clearLocalData] Error updating sync meta:", error);
    throw error;
  }
}

/**
 * Get the current sync metadata
 */
export async function getSyncMeta(): Promise<{
  userId: string;
  dataEpoch: string;
  lastSyncAt: number;
} | null> {
  try {
    const meta = await localDb.syncMeta.get("current");
    return meta
      ? {
          userId: meta.userId,
          dataEpoch: meta.dataEpoch,
          lastSyncAt: meta.lastSyncAt,
        }
      : null;
  } catch (error) {
    console.error("[clearLocalData] Error getting sync meta:", error);
    return null;
  }
}

/**
 * Check if there's an epoch mismatch (server data was reset)
 * @returns true if epoch mismatch detected, false otherwise
 */
export async function checkEpochMismatch(
  userId: string,
  serverEpoch: string,
): Promise<boolean> {
  try {
    const localMeta = await getSyncMeta();

    // No local meta = first login, no mismatch
    if (!localMeta) {
      return false;
    }

    // Different user = no comparison needed
    if (localMeta.userId !== userId) {
      return false;
    }

    // Same user, different epoch = MISMATCH
    const hasMismatch = localMeta.dataEpoch !== serverEpoch;

    if (hasMismatch) {
      console.warn("[clearLocalData] Epoch mismatch detected!", {
        localEpoch: localMeta.dataEpoch,
        serverEpoch,
        userId,
      });
    }

    return hasMismatch;
  } catch (error) {
    console.error("[clearLocalData] Error checking epoch mismatch:", error);
    return false;
  }
}

/**
 * Export all local data as JSON for backup before clearing
 * Returns a JSON object with all entity data
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

    const exportData = {
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

    return exportData;
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
  a.download =
    filename ||
    `local-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EXCLUDED_TABLES = ["users", "localAuthUsers", "syncMeta", "pushSubscriptions"];

/**
 * Fetches all data from the provided local database and triggers a browser download.
 * @param db The Dexie database instance
 * @param prefix Filename prefix (e.g., "database_export" or "database_autosave")
 */
export async function performDatabaseExportGeneric(db: any, prefix: string = "database_export") {
  const allData: Record<string, any[]> = {};

  // Get all table names from the schema
  const tableNames = db.tables.map((table: any) => table.name);

  for (const tableName of tableNames) {
    if (EXCLUDED_TABLES.includes(tableName)) continue;
    
    try {
      const records = await db.table(tableName).toArray();
      if (records.length > 0) {
        allData[tableName] = records;
      }
    } catch (error) {
      console.error(`Failed to export table ${tableName}:`, error);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${prefix}_${timestamp}.json`;

  const jsonString = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Version-specific helpers
import { getDb as getFreeDb } from "@/freelib/dexie/dbSchema";
import { localDb as proDb } from "@/lib/dexie/dbSchema";
import { getScheduleDb } from "@/freelib/dexie/scheduleDb";

export const performFreeDatabaseExport = () => performDatabaseExportGeneric(getFreeDb(), "database_export");
export const performFreeAutoBackup = () => performDatabaseExportGeneric(getFreeDb(), "database_autosave");

export const performProDatabaseExport = () => performDatabaseExportGeneric(proDb, "database_export");
export const performProAutoBackup = () => performDatabaseExportGeneric(proDb, "database_autosave");

export const performScheduleDatabaseExport = () => performDatabaseExportGeneric(getScheduleDb(), "schedule_export");
export const performScheduleAutoBackup = () => performDatabaseExportGeneric(getScheduleDb(), "schedule_autosave");

/**
 * Combined backup for the schedule page (Backups both center data and schedule data)
 */
export async function performCombinedScheduleBackup() {
  await performFreeAutoBackup();
  await performScheduleAutoBackup();
}

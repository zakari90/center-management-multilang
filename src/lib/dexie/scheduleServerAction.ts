/* eslint-disable @typescript-eslint/no-explicit-any */
// scheduleServerAction.ts

import { scheduleActions } from "./dexieActions";
import { Schedule } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/admin/schedule`;

// ✅ Transform server schedule data to match local Schedule interface
function transformServerSchedule(serverSchedule: any): Schedule {
  return {
    id: serverSchedule.id,
    day: serverSchedule.day,
    startTime: serverSchedule.startTime,
    endTime: serverSchedule.endTime,
    roomId: serverSchedule.roomId,
    teacherId: serverSchedule.teacherId,
    subjectId: serverSchedule.subjectId,
    managerId: serverSchedule.managerId,
    centerId: serverSchedule.centerId || undefined,
    status: '1' as const, // Imported schedules are synced
    createdAt: typeof serverSchedule.createdAt === 'string'
      ? new Date(serverSchedule.createdAt).getTime()
      : serverSchedule.createdAt || Date.now(),
    updatedAt: typeof serverSchedule.updatedAt === 'string'
      ? new Date(serverSchedule.updatedAt).getTime()
      : serverSchedule.updatedAt || Date.now(),
  };
}

const ServerActionSchedules = {
  // ✅ Create new schedule on server
  async CreateOnServer(schedule: Schedule) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacherId: schedule.teacherId,
          subjectId: schedule.subjectId,
          roomId: schedule.roomId,
          centerId: schedule.centerId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating schedule on server:", e);
      return null;
    }
  },

  // ✅ Note: Schedules typically don't have update endpoints
  // If update is needed, it would go here

  // ✅ Check if schedule exists on server
  async CheckScheduleExists(id: string): Promise<boolean> {
    try {
      const response = await fetch(api_url);
      if (!response.ok) return false;
      const schedules = await response.json();
      return Array.isArray(schedules) && schedules.some((s: any) => s.id === id);
    } catch (e) {
      console.error("Error checking schedule existence:", e);
      return false;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      return response;
    } catch (e) {
      console.error("Error deleting schedule from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all schedules with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await scheduleActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No schedules to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const schedule of waitingData) {
      try {
        if (schedule.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionSchedules.DeleteFromServer(schedule.id);
          if (result && result.ok) {
            await scheduleActions.deleteLocal(schedule.id);
            results.push({ id: schedule.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: schedule.id, success: false, error: errorMsg });
          }
        } else if (schedule.status === "w") {
          // ✅ Waiting to sync: check if schedule exists, then create
          // Note: Schedules typically don't have update, only create/delete
          const exists = await ServerActionSchedules.CheckScheduleExists(schedule.id);
          let result;
          
          if (!exists) {
            // New schedule, create it
            result = await ServerActionSchedules.CreateOnServer(schedule);
          } else {
            // Schedule already exists, skip or mark as synced
            await scheduleActions.markSynced(schedule.id);
            results.push({ id: schedule.id, success: true });
            continue;
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await scheduleActions.markSynced(schedule.id);
            // ✅ Update local schedule with server response data if available
            if (result.id) {
              await scheduleActions.putLocal({
                ...schedule,
                ...(result.id && { id: result.id }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: schedule.id, success: true });
          } else {
            results.push({ id: schedule.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        // ✅ Continue with next schedule instead of stopping
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing schedule ${schedule.id}:`, error);
        results.push({ id: schedule.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `Schedule sync completed. ${successCount} succeeded, ${failCount} failed.`,
      results,
      successCount,
      failCount,
    };
  },

  async ReadFromServer() {
    try {
      const res = await fetch(api_url, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
      return res.json();
    } catch (e) {
      console.error("Error reading from server:", e);
      throw e;
    }
  },

  async ImportFromServer() {
    // ✅ Check if online before importing
    if (!isOnline()) {
      throw new Error("Cannot import: device is offline");
    }

    try {
      const data = await ServerActionSchedules.ReadFromServer();
      
      // ✅ Store synced schedules as backup before deletion
      const syncedSchedules = await scheduleActions.getByStatus(["1"]);
      const backup = [...syncedSchedules];
      
      try {
        // ✅ Delete all synced schedules to avoid duplicates
        for (const schedule of syncedSchedules) {
          await scheduleActions.deleteLocal(schedule.id);
        }
        
        // ✅ Insert all schedules from server with proper transformation
        const transformedSchedules = Array.isArray(data) 
          ? data.map((schedule: any) => transformServerSchedule(schedule))
          : [];
        for (const schedule of transformedSchedules) {
          await scheduleActions.putLocal(schedule);
        }
        
        return { message: `Imported ${transformedSchedules.length} schedules from server.`, count: transformedSchedules.length };
      } catch (error) {
        // ✅ Restore backup on failure
        console.error("Error during import, restoring backup:", error);
        for (const schedule of backup) {
          await scheduleActions.putLocal(schedule);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionSchedules;


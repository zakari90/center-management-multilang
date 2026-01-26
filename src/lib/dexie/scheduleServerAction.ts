/* eslint-disable @typescript-eslint/no-explicit-any */
// scheduleServerAction.ts

import { scheduleActions } from "./dexieActions";
import { Schedule } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

function getApiUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return pathname;
  }
  return `${baseUrl}${pathname}`;
}

const api_url = getApiUrl("/api/admin/schedule");

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
    status: "1" as const,
    createdAt:
      typeof serverSchedule.createdAt === "string"
        ? new Date(serverSchedule.createdAt).getTime()
        : serverSchedule.createdAt || Date.now(),
    updatedAt:
      typeof serverSchedule.updatedAt === "string"
        ? new Date(serverSchedule.updatedAt).getTime()
        : serverSchedule.updatedAt || Date.now(),
  };
}

const ServerActionSchedules = {
  // ✅ Save schedule to server
  async SaveToServer(schedule: Schedule) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        const errorMessage =
          errorData.error?.message || errorData.error || "Unknown error";
        console.error(
          `❌ Schedule save failed [${response.status}]:`,
          errorMessage,
          errorData,
        );
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      const result = await response.json();
      console.log("✅ Schedule saved to server:", result.id);
      return result;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Network error";
      console.error("❌ Error saving schedule to server:", errorMsg, e);
      // Re-throw with more context instead of returning null
      throw new Error(`Failed to save schedule: ${errorMsg}`);
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Unknown error";
        console.error(
          `❌ Schedule delete failed [${response.status}]:`,
          errorMessage,
        );
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      console.log("✅ Schedule deleted from server:", id);
      return response;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Network error";
      console.error("❌ Error deleting schedule from server:", errorMsg, e);
      throw new Error(`Failed to delete schedule: ${errorMsg}`);
    }
  },

  async Sync() {
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping schedule sync");
        return {
          message: "Cannot sync: offline",
          results: [],
          successCount: 0,
          failCount: 0,
        };
      }

      const waitingData = await scheduleActions.getByStatus(["0", "w"]);
      if (waitingData.length === 0)
        return {
          message: "No schedules to sync.",
          results: [],
          successCount: 0,
          failCount: 0,
        };

      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];

      for (const schedule of waitingData) {
        try {
          if (schedule.status === "0") {
            // Pending deletion
            try {
              await ServerActionSchedules.DeleteFromServer(schedule.id);
              await scheduleActions.deleteLocal(schedule.id);
              results.push({ id: schedule.id, success: true });
            } catch (deleteError) {
              const errorMsg =
                deleteError instanceof Error
                  ? deleteError.message
                  : "Delete failed";
              console.error(
                `❌ Failed to delete schedule ${schedule.id}:`,
                deleteError,
              );

              // ✅ Save error to local DB
              await scheduleActions.update(schedule.id, {
                syncError: errorMsg,
              });

              results.push({
                id: schedule.id,
                success: false,
                error: errorMsg,
              });
            }
          } else if (schedule.status === "w") {
            // Waiting to sync
            try {
              const result = await ServerActionSchedules.SaveToServer(schedule);
              // Mark as synced and clear any previous errors
              await scheduleActions.putLocal({
                ...schedule,
                ...(result.id && { id: result.id }),
                status: "1" as const,
                syncError: undefined, // ✅ Clear error on success
                updatedAt: Date.now(),
              });
              results.push({ id: schedule.id, success: true });
            } catch (saveError) {
              const errorMsg =
                saveError instanceof Error ? saveError.message : "Save failed";
              console.error(
                `❌ Failed to save schedule ${schedule.id}:`,
                saveError,
              );

              // ✅ Save error to local DB
              await scheduleActions.update(schedule.id, {
                syncError: errorMsg,
              });

              results.push({
                id: schedule.id,
                success: false,
                error: errorMsg,
              });
            }
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Error syncing schedule ${schedule.id}:`, error);

          try {
            await scheduleActions.update(schedule.id, { syncError: errorMsg });
          } catch (updateErr) {
            console.error("Failed to update sync error:", updateErr);
          }

          results.push({ id: schedule.id, success: false, error: errorMsg });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      return {
        message: `Schedule sync completed. ${successCount} succeeded, ${failCount} failed.`,
        results,
        successCount,
        failCount,
      };
    } catch (globalError: any) {
      console.error(
        "Critical error in ServerActionSchedules.Sync:",
        globalError,
      );
      return {
        message: "Sync failed completely",
        results: [],
        successCount: 0,
        failCount: 1,
        error: globalError.message,
      };
    }
  },

  async ReadFromServer() {
    try {
      const res = await fetch(api_url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
      return res.json();
    } catch (e) {
      console.error("Error reading from server:", e);
      throw e;
    }
  },

  async ImportFromServer() {
    if (!isOnline()) {
      throw new Error("Cannot import: device is offline");
    }

    try {
      const data = await ServerActionSchedules.ReadFromServer();
      const syncedSchedules = await scheduleActions.getByStatus(["1"]);
      const backup = [...syncedSchedules];

      try {
        for (const schedule of syncedSchedules) {
          await scheduleActions.deleteLocal(schedule.id);
        }

        const transformedSchedules = Array.isArray(data)
          ? data.map((schedule: any) => transformServerSchedule(schedule))
          : [];
        for (const schedule of transformedSchedules) {
          const existing = await scheduleActions.getLocal(schedule.id);
          if (existing && existing.status === "w") {
            continue; // Don't overwrite local pending changes
          }
          await scheduleActions.putLocal(schedule);
        }

        return {
          message: `Imported ${transformedSchedules.length} schedules from server.`,
          count: transformedSchedules.length,
        };
      } catch (error) {
        console.error("Error during import, restoring backup:", error);
        for (const schedule of backup) {
          await scheduleActions.putLocal(schedule);
        }
        throw new Error(
          "Import failed, local data restored. Error: " +
            (error instanceof Error ? error.message : "Unknown"),
        );
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  },
};

export default ServerActionSchedules;

/* eslint-disable @typescript-eslint/no-explicit-any */
// teacherServerAction.ts

import { teacherActions, teacherSubjectActions } from "./dexieActions";
import { Teacher } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

function getApiUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return pathname;
  }
  return `${baseUrl}${pathname}`;
}

const api_url = getApiUrl("/api/teachers");

// ✅ Transform server teacher data to match local Teacher interface
function transformServerTeacher(serverTeacher: any): Teacher {
  return {
    id: serverTeacher.id,
    name: serverTeacher.name,
    email: serverTeacher.email || undefined,
    phone: serverTeacher.phone || undefined,
    address: serverTeacher.address || undefined,
    weeklySchedule: serverTeacher.weeklySchedule || undefined,
    managerId: serverTeacher.managerId,
    status: "1" as const,
    createdAt:
      typeof serverTeacher.createdAt === "string"
        ? new Date(serverTeacher.createdAt).getTime()
        : serverTeacher.createdAt || Date.now(),
    updatedAt:
      typeof serverTeacher.updatedAt === "string"
        ? new Date(serverTeacher.updatedAt).getTime()
        : serverTeacher.updatedAt || Date.now(),
  };
}

const ServerActionTeachers = {
  // ✅ Save teacher to server (handles both create and update)
  async SaveToServer(teacher: Teacher) {
    try {
      const teacherSubjects = await teacherSubjectActions.getAll();
      const subjects = teacherSubjects
        .filter((ts) => ts.teacherId === teacher.id && ts.status !== "0")
        .map((ts) => ({
          subjectId: ts.subjectId,
          percentage: ts.percentage ?? null,
          hourlyRate: ts.hourlyRate ?? null,
        }));

      // Try POST first (create)
      let response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          managerId: teacher.managerId,
          weeklySchedule: teacher.weeklySchedule
            ? Array.isArray(teacher.weeklySchedule)
              ? teacher.weeklySchedule
              : Object.values(teacher.weeklySchedule)
            : [],
          subjects,
        }),
      });

      // If POST fails with conflict, try PATCH (update)
      if (!response.ok && response.status === 409) {
        response = await fetch(`${api_url}/${teacher.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            address: teacher.address,
            managerId: teacher.managerId,
            weeklySchedule: teacher.weeklySchedule
              ? Array.isArray(teacher.weeklySchedule)
                ? teacher.weeklySchedule
                : Object.values(teacher.weeklySchedule)
              : [],
            subjects,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || "Unknown error"}`,
        );
      }
      return response.json();
    } catch (e) {
      console.error("Error saving teacher to server:", e);
      return null;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return response;
    } catch (e) {
      console.error("Error deleting teacher from server:", e);
      return null;
    }
  },

  async softDeleteTeacher(id: string) {
    return this.DeleteFromServer(id);
  },

  async Sync() {
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping teacher sync");
        return {
          message: "Cannot sync: offline",
          results: [],
          successCount: 0,
          failCount: 0,
        };
      }

      const waitingData = await teacherActions.getByStatus(["0", "w"]);
      if (waitingData.length === 0)
        return {
          message: "No teachers to sync.",
          results: [],
          successCount: 0,
          failCount: 0,
        };

      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];

      for (const teacher of waitingData) {
        try {
          if (teacher.status === "0") {
            // Pending deletion
            const result = await ServerActionTeachers.DeleteFromServer(
              teacher.id,
            );
            if (result && result.ok) {
              await teacherActions.deleteLocal(teacher.id);
              results.push({ id: teacher.id, success: true });
            } else {
              const errorMsg = result
                ? `Server returned ${result.status}`
                : "Network error";
              results.push({ id: teacher.id, success: false, error: errorMsg });
            }
          } else if (teacher.status === "w") {
            // Waiting to sync
            const result = await ServerActionTeachers.SaveToServer(teacher);
            if (result) {
              teacher.status = "1"; // Mark as synced
              await teacherActions.putLocal({
                ...teacher,
                ...(result.id && { id: result.id }),
                ...(result.name && { name: result.name }),
                ...(result.email !== undefined && { email: result.email }),
                ...(result.phone !== undefined && { phone: result.phone }),
                ...(result.address !== undefined && {
                  address: result.address,
                }),
                ...(result.weeklySchedule && {
                  weeklySchedule: result.weeklySchedule,
                }),
                status: "1" as const,
                updatedAt: Date.now(),
              });
              results.push({ id: teacher.id, success: true });
            } else {
              results.push({
                id: teacher.id,
                success: false,
                error: "Server request failed",
              });
            }
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`Error syncing teacher ${teacher.id}:`, error);
          results.push({ id: teacher.id, success: false, error: errorMsg });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      return {
        message: `Teacher sync completed. ${successCount} succeeded, ${failCount} failed.`,
        results,
        successCount,
        failCount,
      };
    } catch (globalError: any) {
      console.error(
        "Critical error in ServerActionTeachers.Sync:",
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
      const data = await ServerActionTeachers.ReadFromServer();

      // ✅ Get pending local changes that should NOT be overwritten
      const pendingTeachers = await teacherActions.getByStatus(["w", "0"]);
      const pendingIds = new Set(pendingTeachers.map((t) => t.id));

      // ✅ Also get pending teacherSubjects
      const pendingTeacherSubjects = await teacherSubjectActions.getByStatus([
        "w",
        "0",
      ]);
      const pendingTeacherSubjectIds = new Set(
        pendingTeacherSubjects.map((ts) => ts.id),
      );

      const syncedTeachers = await teacherActions.getByStatus(["1"]);
      const backup = [...syncedTeachers];

      try {
        for (const teacher of syncedTeachers) {
          await teacherActions.deleteLocal(teacher.id);
        }

        const transformedTeachers = Array.isArray(data)
          ? data.map((teacher: any) => transformServerTeacher(teacher))
          : [];

        // ✅ Collect all teacherSubjects from server response
        const allTeacherSubjects: any[] = [];
        if (Array.isArray(data)) {
          for (const teacher of data) {
            if (
              teacher.teacherSubjects &&
              Array.isArray(teacher.teacherSubjects)
            ) {
              for (const ts of teacher.teacherSubjects) {
                // Skip if there are pending local changes for this teacherSubject
                if (pendingTeacherSubjectIds.has(ts.id)) {
                  continue;
                }

                allTeacherSubjects.push({
                  id: ts.id,
                  teacherId: ts.teacherId,
                  subjectId: ts.subjectId,
                  percentage: ts.percentage ?? null,
                  hourlyRate: ts.hourlyRate ?? null,
                  assignedAt:
                    typeof ts.assignedAt === "string"
                      ? new Date(ts.assignedAt).getTime()
                      : ts.assignedAt || Date.now(),
                  status: "1" as const,
                  createdAt:
                    typeof ts.createdAt === "string"
                      ? new Date(ts.createdAt).getTime()
                      : ts.createdAt || Date.now(),
                  updatedAt:
                    typeof ts.updatedAt === "string"
                      ? new Date(ts.updatedAt).getTime()
                      : ts.updatedAt || Date.now(),
                });
              }
            }
          }
        }

        for (const teacher of transformedTeachers) {
          // ✅ Skip if there are pending local changes for this teacher
          if (pendingIds.has(teacher.id)) {
            continue;
          }

          const existing = await teacherActions.getLocal(teacher.id);
          if (existing && existing.status === "w") {
            continue; // Don't overwrite local pending changes
          }
          await teacherActions.putLocal(teacher);
        }

        // ✅ Clear synced teacherSubjects for the imported teachers and save new ones
        const syncedTeacherSubjects = await teacherSubjectActions.getByStatus([
          "1",
        ]);
        const teacherIdsToImport = new Set(
          transformedTeachers
            .filter((t) => !pendingIds.has(t.id))
            .map((t) => t.id),
        );

        for (const ts of syncedTeacherSubjects) {
          // Only delete teacherSubjects for teachers we're importing
          if (teacherIdsToImport.has(ts.teacherId)) {
            await teacherSubjectActions.deleteLocal(ts.id);
          }
        }

        // ✅ Save all teacherSubjects from server
        for (const ts of allTeacherSubjects) {
          await teacherSubjectActions.putLocal(ts);
        }

        if (pendingIds.size > 0) {
        }

        return {
          message: `Imported ${transformedTeachers.length} teachers from server.`,
          count: transformedTeachers.length,
        };
      } catch (error) {
        console.error("Error during import, restoring backup:", error);
        for (const teacher of backup) {
          await teacherActions.putLocal(teacher);
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

export default ServerActionTeachers;

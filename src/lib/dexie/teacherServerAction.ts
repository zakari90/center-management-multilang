/* eslint-disable @typescript-eslint/no-explicit-any */
// teacherServerAction.ts

import { teacherActions } from "./dexieActions";
import { Teacher } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/teachers`;

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
    status: '1' as const, // Imported teachers are synced
    createdAt: typeof serverTeacher.createdAt === 'string'
      ? new Date(serverTeacher.createdAt).getTime()
      : serverTeacher.createdAt || Date.now(),
    updatedAt: typeof serverTeacher.updatedAt === 'string'
      ? new Date(serverTeacher.updatedAt).getTime()
      : serverTeacher.updatedAt || Date.now(),
  };
}

const ServerActionTeachers = {
  // ✅ Create new teacher on server
  async CreateOnServer(teacher: Teacher) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
        body: JSON.stringify({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          weeklySchedule: teacher.weeklySchedule ? (Array.isArray(teacher.weeklySchedule) ? teacher.weeklySchedule : Object.values(teacher.weeklySchedule)) : [],
          subjects: [], // TeacherSubjects are handled separately
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating teacher on server:", e);
      return null;
    }
  },

  // ✅ Update existing teacher on server
  async UpdateOnServer(teacher: Teacher) {
    try {
      const response = await fetch(`${api_url}/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
        body: JSON.stringify({
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          weeklySchedule: teacher.weeklySchedule ? (Array.isArray(teacher.weeklySchedule) ? teacher.weeklySchedule : Object.values(teacher.weeklySchedule)) : [],
          subjects: [], // TeacherSubjects are handled separately
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error updating teacher on server:", e);
      return null;
    }
  },

  // ✅ Check if teacher exists on server
  async CheckTeacherExists(id: string): Promise<boolean> {
    try {
      const response = await fetch(api_url, {
        credentials: "include", // ✅ Include cookies for session authentication
      });
      if (!response.ok) return false;
      const teachers = await response.json();
      return Array.isArray(teachers) && teachers.some((t: any) => t.id === id);
    } catch (e) {
      console.error("Error checking teacher existence:", e);
      return false;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
      });
      return response;
    } catch (e) {
      console.error("Error deleting teacher from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all teachers with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await teacherActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No teachers to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const teacher of waitingData) {
      try {
        if (teacher.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionTeachers.DeleteFromServer(teacher.id);
          if (result && result.ok) {
            await teacherActions.deleteLocal(teacher.id);
            results.push({ id: teacher.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: teacher.id, success: false, error: errorMsg });
          }
        } else if (teacher.status === "w") {
          // ✅ Waiting to sync: check if teacher exists, then create or update
          const exists = await ServerActionTeachers.CheckTeacherExists(teacher.id);
          let result;
          
          if (exists) {
            // Teacher exists on server, update it
            result = await ServerActionTeachers.UpdateOnServer(teacher);
          } else {
            // New teacher, create it
            result = await ServerActionTeachers.CreateOnServer(teacher);
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await teacherActions.markSynced(teacher.id);
            // ✅ Update local teacher with server response data if available
            if (result.id) {
              await teacherActions.putLocal({
                ...teacher,
                ...(result.id && { id: result.id }),
                ...(result.name && { name: result.name }),
                ...(result.email !== undefined && { email: result.email }),
                ...(result.phone !== undefined && { phone: result.phone }),
                ...(result.address !== undefined && { address: result.address }),
                ...(result.weeklySchedule && { weeklySchedule: result.weeklySchedule }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: teacher.id, success: true });
          } else {
            results.push({ id: teacher.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        // ✅ Continue with next teacher instead of stopping
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing teacher ${teacher.id}:`, error);
        results.push({ id: teacher.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `Teacher sync completed. ${successCount} succeeded, ${failCount} failed.`,
      results,
      successCount,
      failCount,
    };
  },

  async ReadFromServer() {
    try {
      const res = await fetch(api_url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
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
      const data = await ServerActionTeachers.ReadFromServer();
      
      // ✅ Store synced teachers as backup before deletion
      const syncedTeachers = await teacherActions.getByStatus(["1"]);
      const backup = [...syncedTeachers];
      
      try {
        // ✅ Delete all synced teachers to avoid duplicates
        for (const teacher of syncedTeachers) {
          await teacherActions.deleteLocal(teacher.id);
        }
        
        // ✅ Insert all teachers from server with proper transformation
        // ✅ Preserve local 'w' status data - don't overwrite pending local changes
        const transformedTeachers = Array.isArray(data) 
          ? data.map((teacher: any) => transformServerTeacher(teacher))
          : [];
        for (const teacher of transformedTeachers) {
          // Check if local teacher exists with 'w' status - preserve it
          const existing = await teacherActions.getLocal(teacher.id);
          if (existing && existing.status === 'w') {
            // Don't overwrite local pending changes
            continue;
          }
          await teacherActions.putLocal(teacher);
        }
        
        return { message: `Imported ${transformedTeachers.length} teachers from server.`, count: transformedTeachers.length };
      } catch (error) {
        // ✅ Restore backup on failure
        console.error("Error during import, restoring backup:", error);
        for (const teacher of backup) {
          await teacherActions.putLocal(teacher);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionTeachers;


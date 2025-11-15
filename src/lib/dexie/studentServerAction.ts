/* eslint-disable @typescript-eslint/no-explicit-any */
// studentServerAction.ts

import { studentActions } from "./dexieActions";
import { Student } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/students`;

// ✅ Transform server student data to match local Student interface
function transformServerStudent(serverStudent: any): Student {
  return {
    id: serverStudent.id,
    name: serverStudent.name,
    email: serverStudent.email || undefined,
    phone: serverStudent.phone || undefined,
    parentName: serverStudent.parentName || undefined,
    parentPhone: serverStudent.parentPhone || undefined,
    parentEmail: serverStudent.parentEmail || undefined,
    grade: serverStudent.grade || undefined,
    managerId: serverStudent.managerId,
    status: '1' as const, // Imported students are synced
    createdAt: typeof serverStudent.createdAt === 'string'
      ? new Date(serverStudent.createdAt).getTime()
      : serverStudent.createdAt || Date.now(),
    updatedAt: typeof serverStudent.updatedAt === 'string'
      ? new Date(serverStudent.updatedAt).getTime()
      : serverStudent.updatedAt || Date.now(),
  };
}

const ServerActionStudents = {
  // ✅ Create new student on server
  async CreateOnServer(student: Student) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: student.name,
          email: student.email,
          phone: student.phone,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          grade: student.grade,
          enrollments: [], // StudentSubjects are handled separately
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating student on server:", e);
      return null;
    }
  },

  // ✅ Update existing student on server
  async UpdateOnServer(student: Student) {
    try {
      const response = await fetch(`${api_url}/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: student.name,
          email: student.email,
          phone: student.phone,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          grade: student.grade,
          enrollments: [], // StudentSubjects are handled separately
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error updating student on server:", e);
      return null;
    }
  },

  // ✅ Check if student exists on server
  async CheckStudentExists(id: string): Promise<boolean> {
    try {
      const response = await fetch(api_url);
      if (!response.ok) return false;
      const students = await response.json();
      return Array.isArray(students) && students.some((s: any) => s.id === id);
    } catch (e) {
      console.error("Error checking student existence:", e);
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
      console.error("Error deleting student from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all students with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await studentActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No students to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const student of waitingData) {
      try {
        if (student.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionStudents.DeleteFromServer(student.id);
          if (result && result.ok) {
            await studentActions.deleteLocal(student.id);
            results.push({ id: student.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: student.id, success: false, error: errorMsg });
          }
        } else if (student.status === "w") {
          // ✅ Waiting to sync: check if student exists, then create or update
          const exists = await ServerActionStudents.CheckStudentExists(student.id);
          let result;
          
          if (exists) {
            // Student exists on server, update it
            result = await ServerActionStudents.UpdateOnServer(student);
          } else {
            // New student, create it
            result = await ServerActionStudents.CreateOnServer(student);
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await studentActions.markSynced(student.id);
            // ✅ Update local student with server response data if available
            if (result.id) {
              await studentActions.putLocal({
                ...student,
                ...(result.id && { id: result.id }),
                ...(result.name && { name: result.name }),
                ...(result.email !== undefined && { email: result.email }),
                ...(result.phone !== undefined && { phone: result.phone }),
                ...(result.parentName !== undefined && { parentName: result.parentName }),
                ...(result.parentPhone !== undefined && { parentPhone: result.parentPhone }),
                ...(result.parentEmail !== undefined && { parentEmail: result.parentEmail }),
                ...(result.grade !== undefined && { grade: result.grade }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: student.id, success: true });
          } else {
            results.push({ id: student.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        // ✅ Continue with next student instead of stopping
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing student ${student.id}:`, error);
        results.push({ id: student.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `Student sync completed. ${successCount} succeeded, ${failCount} failed.`,
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
      const data = await ServerActionStudents.ReadFromServer();
      
      // ✅ Store synced students as backup before deletion
      const syncedStudents = await studentActions.getByStatus(["1"]);
      const backup = [...syncedStudents];
      
      try {
        // ✅ Delete all synced students to avoid duplicates
        for (const student of syncedStudents) {
          await studentActions.deleteLocal(student.id);
        }
        
        // ✅ Insert all students from server with proper transformation
        // ✅ Preserve local 'w' status data - don't overwrite pending local changes
        const transformedStudents = Array.isArray(data) 
          ? data.map((student: any) => transformServerStudent(student))
          : [];
        for (const student of transformedStudents) {
          // Check if local student exists with 'w' status - preserve it
          const existing = await studentActions.getLocal(student.id);
          if (existing && existing.status === 'w') {
            // Don't overwrite local pending changes
            continue;
          }
          await studentActions.putLocal(student);
        }
        
        return { message: `Imported ${transformedStudents.length} students from server.`, count: transformedStudents.length };
      } catch (error) {
        // ✅ Restore backup on failure
        console.error("Error during import, restoring backup:", error);
        for (const student of backup) {
          await studentActions.putLocal(student);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionStudents;


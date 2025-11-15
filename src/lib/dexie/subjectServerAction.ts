/* eslint-disable @typescript-eslint/no-explicit-any */
// subjectServerAction.ts

import { subjectActions } from "./dexieActions";
import { Subject } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/subjects`;

// ✅ Transform server subject data to match local Subject interface
function transformServerSubject(serverSubject: any): Subject {
  return {
    id: serverSubject.id,
    name: serverSubject.name,
    grade: serverSubject.grade,
    price: serverSubject.price,
    duration: serverSubject.duration || undefined,
    centerId: serverSubject.centerId,
    status: '1' as const, // Imported subjects are synced
    createdAt: typeof serverSubject.createdAt === 'string'
      ? new Date(serverSubject.createdAt).getTime()
      : serverSubject.createdAt || Date.now(),
    updatedAt: typeof serverSubject.updatedAt === 'string'
      ? new Date(serverSubject.updatedAt).getTime()
      : serverSubject.updatedAt || Date.now(),
  };
}

const ServerActionSubjects = {
  // ✅ Create new subject on server
  async CreateOnServer(subject: Subject) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: subject.centerId,
          name: subject.name,
          grade: subject.grade,
          price: subject.price,
          duration: subject.duration,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating subject on server:", e);
      return null;
    }
  },

  // ✅ Update existing subject on server
  async UpdateOnServer(subject: Subject) {
    try {
      const response = await fetch(api_url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          name: subject.name,
          grade: subject.grade,
          price: subject.price,
          duration: subject.duration,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error updating subject on server:", e);
      return null;
    }
  },

  // ✅ Check if subject exists on server
  async CheckSubjectExists(id: string): Promise<boolean> {
    try {
      const response = await fetch(api_url);
      if (!response.ok) return false;
      const subjects = await response.json();
      return Array.isArray(subjects) && subjects.some((s: any) => s.id === id);
    } catch (e) {
      console.error("Error checking subject existence:", e);
      return false;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(api_url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: id }),
      });
      return response;
    } catch (e) {
      console.error("Error deleting subject from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all subjects with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await subjectActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No subjects to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const subject of waitingData) {
      try {
        if (subject.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionSubjects.DeleteFromServer(subject.id);
          if (result && result.ok) {
            await subjectActions.deleteLocal(subject.id);
            results.push({ id: subject.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: subject.id, success: false, error: errorMsg });
          }
        } else if (subject.status === "w") {
          // ✅ Waiting to sync: check if subject exists, then create or update
          const exists = await ServerActionSubjects.CheckSubjectExists(subject.id);
          let result;
          
          if (exists) {
            // Subject exists on server, update it
            result = await ServerActionSubjects.UpdateOnServer(subject);
          } else {
            // New subject, create it
            result = await ServerActionSubjects.CreateOnServer(subject);
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await subjectActions.markSynced(subject.id);
            // ✅ Update local subject with server response data if available
            if (result.id) {
              await subjectActions.putLocal({
                ...subject,
                ...(result.id && { id: result.id }),
                ...(result.name && { name: result.name }),
                ...(result.grade && { grade: result.grade }),
                ...(result.price !== undefined && { price: result.price }),
                ...(result.duration !== undefined && { duration: result.duration }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: subject.id, success: true });
          } else {
            results.push({ id: subject.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        // ✅ Continue with next subject instead of stopping
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing subject ${subject.id}:`, error);
        results.push({ id: subject.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `Subject sync completed. ${successCount} succeeded, ${failCount} failed.`,
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
      const data = await ServerActionSubjects.ReadFromServer();
      
      // ✅ Store synced subjects as backup before deletion
      const syncedSubjects = await subjectActions.getByStatus(["1"]);
      const backup = [...syncedSubjects];
      
      try {
        // ✅ Delete all synced subjects to avoid duplicates
        for (const subject of syncedSubjects) {
          await subjectActions.deleteLocal(subject.id);
        }
        
        // ✅ Insert all subjects from server with proper transformation
        // ✅ Preserve local 'w' status data - don't overwrite pending local changes
        const transformedSubjects = Array.isArray(data) 
          ? data.map((subject: any) => transformServerSubject(subject))
          : [];
        for (const subject of transformedSubjects) {
          // Check if local subject exists with 'w' status - preserve it
          const existing = await subjectActions.getLocal(subject.id);
          if (existing && existing.status === 'w') {
            // Don't overwrite local pending changes
            continue;
          }
          await subjectActions.putLocal(subject);
        }
        
        return { message: `Imported ${transformedSubjects.length} subjects from server.`, count: transformedSubjects.length };
      } catch (error) {
        // ✅ Restore backup on failure
        console.error("Error during import, restoring backup:", error);
        for (const subject of backup) {
          await subjectActions.putLocal(subject);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionSubjects;


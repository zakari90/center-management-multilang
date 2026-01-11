/* eslint-disable @typescript-eslint/no-explicit-any */
// subjectServerAction.ts

import { subjectActions } from "./dexieActions";
import { Subject } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

function getApiUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return pathname;
  }
  return `${baseUrl}${pathname}`;
}

const api_url = getApiUrl("/api/subjects");

// ✅ Transform server subject data to match local Subject interface
function transformServerSubject(serverSubject: any): Subject {
  return {
    id: serverSubject.id,
    name: serverSubject.name,
    grade: serverSubject.grade,
    price: serverSubject.price,
    duration: serverSubject.duration || undefined,
    centerId: serverSubject.centerId,
    status: '1' as const,
    createdAt: typeof serverSubject.createdAt === 'string'
      ? new Date(serverSubject.createdAt).getTime()
      : serverSubject.createdAt || Date.now(),
    updatedAt: typeof serverSubject.updatedAt === 'string'
      ? new Date(serverSubject.updatedAt).getTime()
      : serverSubject.updatedAt || Date.now(),
  };
}

const ServerActionSubjects = {
  // ✅ Save subject to server (handles both create and update)
  async SaveToServer(subject: Subject) {
    try {
      // Try POST first (create)
      let response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: subject.id,
          centerId: subject.centerId,
          name: subject.name,
          grade: subject.grade,
          price: subject.price,
          duration: subject.duration,
          createdAt: new Date(subject.createdAt).toISOString(),
          updatedAt: new Date(subject.updatedAt).toISOString(),
        }),
      });

      // If POST fails with conflict, try PATCH (update)
      if (!response.ok && response.status === 409) {
        response = await fetch(api_url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            subjectId: subject.id,
            name: subject.name,
            grade: subject.grade,
            price: subject.price,
            duration: subject.duration,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error saving subject to server:", e);
      throw e;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(api_url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subjectId: id }),
      });
      return response;
    } catch (e) {
      console.error("Error deleting subject from server:", e);
      return null;
    }
  },

  async Sync() {
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping subject sync");
        return { message: "Cannot sync: offline", results: [], successCount: 0, failCount: 0 };
      }

      const waitingData = await subjectActions.getByStatus(["0", "w"]);
      if (waitingData.length === 0) return { message: "No subjects to sync.", results: [], successCount: 0, failCount: 0 };

      const results: Array<{ id: string; success: boolean; error?: string }> = [];

      for (const subject of waitingData) {
        try {
          if (subject.status === "0") {
            // Pending deletion
            const result = await ServerActionSubjects.DeleteFromServer(subject.id);
            if (result && result.ok) {
              await subjectActions.deleteLocal(subject.id);
              results.push({ id: subject.id, success: true });
            } else {
              const errorMsg = result ? `Server returned ${result.status}` : "Network error";
              results.push({ id: subject.id, success: false, error: errorMsg });
            }
          } else if (subject.status === "w") {
            // Waiting to sync
            const result = await ServerActionSubjects.SaveToServer(subject);
            if (result) {
              subject.status = "1"; // Mark as synced
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
              results.push({ id: subject.id, success: true });
            } else {
              results.push({ id: subject.id, success: false, error: "Server request failed" });
            }
          }
        } catch (error) {
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
    } catch (globalError: any) {
       console.error("Critical error in ServerActionSubjects.Sync:", globalError);
       return { 
         message: "Sync failed completely", 
         results: [], 
         successCount: 0, 
         failCount: 1, 
         error: globalError.message 
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
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping import");
        return { message: "Cannot import: offline", count: 0, failCount: 0 };
      }

      const data = await ServerActionSubjects.ReadFromServer();
      const syncedSubjects = await subjectActions.getByStatus(["1"]);
      const backup = [...syncedSubjects];
      
      try {
        for (const subject of syncedSubjects) {
          await subjectActions.deleteLocal(subject.id);
        }
        
        const transformedSubjects = Array.isArray(data) 
          ? data.map((subject: any) => transformServerSubject(subject))
          : [];
        for (const subject of transformedSubjects) {
          const existing = await subjectActions.getLocal(subject.id);
          if (existing && existing.status === 'w') {
            continue; // Don't overwrite local pending changes
          }
          await subjectActions.putLocal(subject);
        }
        
        return { 
          message: `Imported ${transformedSubjects.length} subjects from server.`, 
          count: transformedSubjects.length,
          failCount: 0
        };
      } catch (error) {
        console.error("Error during import, restoring backup:", error);
        for (const subject of backup) {
          await subjectActions.putLocal(subject);
        }
        return { 
          message: "Import failed, data restored", 
          count: 0, 
          failCount: 1, 
          error: error instanceof Error ? error.message : "Unknown error" 
        };
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      return { 
         message: "Import failed", 
         count: 0, 
         failCount: 1, 
         error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
};

export default ServerActionSubjects;

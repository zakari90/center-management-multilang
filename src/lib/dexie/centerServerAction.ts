/* eslint-disable @typescript-eslint/no-explicit-any */
// centerServerAction.ts

import { centerActions } from "./dexieActions";
import { Center } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/center`;

// ✅ Transform server center data to match local Center interface
function transformServerCenter(serverCenter: any): Center {
  return {
    id: serverCenter.id,
    name: serverCenter.name,
    address: serverCenter.address || undefined,
    phone: serverCenter.phone || undefined,
    classrooms: Array.isArray(serverCenter.classrooms) ? serverCenter.classrooms : [],
    workingDays: Array.isArray(serverCenter.workingDays) ? serverCenter.workingDays : [],
    managers: Array.isArray(serverCenter.managers) ? serverCenter.managers : [],
    adminId: serverCenter.adminId,
    status: '1' as const, // Imported centers are synced
    createdAt: typeof serverCenter.createdAt === 'string'
      ? new Date(serverCenter.createdAt).getTime()
      : serverCenter.createdAt || Date.now(),
    updatedAt: typeof serverCenter.updatedAt === 'string'
      ? new Date(serverCenter.updatedAt).getTime()
      : serverCenter.updatedAt || Date.now(),
  };
}

const ServerActionCenters = {
  // ✅ Create new center on server
  async CreateOnServer(center: Center) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms: center.classrooms,
          workingDays: center.workingDays,
          subjects: [], // Subjects are handled separately
          createdAt: new Date(center.createdAt).toISOString(),
          updatedAt: new Date(center.updatedAt).toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating center on server:", e);
      return null;
    }
  },

  // ✅ Update existing center on server
  async UpdateOnServer(center: Center) {
    try {
      const response = await fetch(api_url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms: center.classrooms,
          workingDays: center.workingDays,
          updatedAt: new Date(center.updatedAt).toISOString(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error updating center on server:", e);
      return null;
    }
  },

  // ✅ Check if center exists on server
  async CheckCenterExists(id: string): Promise<boolean> {
    try {
      const response = await fetch(api_url);
      if (!response.ok) return false;
      const centers = await response.json();
      return Array.isArray(centers) && centers.some((c: any) => c.id === id);
    } catch (e) {
      console.error("Error checking center existence:", e);
      return false;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}?id=${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      return response;
    } catch (e) {
      console.error("Error deleting center from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all centers with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await centerActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No centers to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const center of waitingData) {
      try {
        if (center.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionCenters.DeleteFromServer(center.id);
          if (result && result.ok) {
            await centerActions.deleteLocal(center.id);
            results.push({ id: center.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: center.id, success: false, error: errorMsg });
          }
        } else if (center.status === "w") {
          // ✅ Waiting to sync: check if center exists, then create or update
          const exists = await ServerActionCenters.CheckCenterExists(center.id);
          let result;
          
          if (exists) {
            // Center exists on server, update it
            result = await ServerActionCenters.UpdateOnServer(center);
          } else {
            // New center, create it
            result = await ServerActionCenters.CreateOnServer(center);
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await centerActions.markSynced(center.id);
            // ✅ Update local center with server response data if available
            if (result.id) {
              await centerActions.putLocal({
                ...center,
                ...(result.id && { id: result.id }),
                ...(result.name && { name: result.name }),
                ...(result.address !== undefined && { address: result.address }),
                ...(result.phone !== undefined && { phone: result.phone }),
                ...(result.classrooms && { classrooms: result.classrooms }),
                ...(result.workingDays && { workingDays: result.workingDays }),
                ...(result.managers && { managers: result.managers }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: center.id, success: true });
          } else {
            results.push({ id: center.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        // ✅ Continue with next center instead of stopping
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing center ${center.id}:`, error);
        results.push({ id: center.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `Center sync completed. ${successCount} succeeded, ${failCount} failed.`,
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
      const data = await ServerActionCenters.ReadFromServer();
      
      // ✅ Store synced centers as backup before deletion
      const syncedCenters = await centerActions.getByStatus(["1"]);
      const backup = [...syncedCenters];
      
      try {
        // ✅ Delete all synced centers to avoid duplicates
        for (const center of syncedCenters) {
          await centerActions.deleteLocal(center.id);
        }
        
        // ✅ Insert all centers from server with proper transformation
        const transformedCenters = Array.isArray(data) 
          ? data.map((center: any) => transformServerCenter(center))
          : [];
        for (const center of transformedCenters) {
          await centerActions.putLocal(center);
        }
        
        return { message: `Imported ${transformedCenters.length} centers from server.`, count: transformedCenters.length };
      } catch (error) {
        // ✅ Restore backup on failure
        console.error("Error during import, restoring backup:", error);
        for (const center of backup) {
          await centerActions.putLocal(center);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionCenters;


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
    status: '1' as const,
    createdAt: typeof serverCenter.createdAt === 'string'
      ? new Date(serverCenter.createdAt).getTime()
      : serverCenter.createdAt || Date.now(),
    updatedAt: typeof serverCenter.updatedAt === 'string'
      ? new Date(serverCenter.updatedAt).getTime()
      : serverCenter.updatedAt || Date.now(),
  };
}

const ServerActionCenters = {
  // ✅ Save center to server (handles both create and update)
  async SaveToServer(center: Center) {
    try {
      // Try POST first (create)
      let response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms: center.classrooms,
          workingDays: center.workingDays,
          subjects: [],
          createdAt: new Date(center.createdAt).toISOString(),
          updatedAt: new Date(center.updatedAt).toISOString(),
        }),
      });

      // If POST fails with conflict, try PATCH (update)
      if (!response.ok && response.status === 409) {
        response = await fetch(api_url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error saving center to server:", e);
      return null;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}?id=${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return response;
    } catch (e) {
      console.error("Error deleting center from server:", e);
      return null;
    }
  },

  async Sync() {
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    const waitingData = await centerActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No centers to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const center of waitingData) {
      try {
        if (center.status === "0") {
          // Pending deletion
          const result = await ServerActionCenters.DeleteFromServer(center.id);
          if (result && result.ok) {
            await centerActions.deleteLocal(center.id);
            results.push({ id: center.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: center.id, success: false, error: errorMsg });
          }
        } else if (center.status === "w") {
          // Waiting to sync
          const result = await ServerActionCenters.SaveToServer(center);
          if (result) {
            center.status = "1"; // Mark as synced
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
            results.push({ id: center.id, success: true });
          } else {
            results.push({ id: center.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
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
      const data = await ServerActionCenters.ReadFromServer();
      const syncedCenters = await centerActions.getByStatus(["1"]);
      const backup = [...syncedCenters];
      
      try {
        for (const center of syncedCenters) {
          await centerActions.deleteLocal(center.id);
        }
        
        const transformedCenters = Array.isArray(data) 
          ? data.map((center: any) => transformServerCenter(center))
          : [];
        for (const center of transformedCenters) {
          await centerActions.putLocal(center);
        }
        
        return { message: `Imported ${transformedCenters.length} centers from server.`, count: transformedCenters.length };
      } catch (error) {
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

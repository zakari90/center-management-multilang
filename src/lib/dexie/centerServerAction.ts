/* eslint-disable @typescript-eslint/no-explicit-any */
import { centerActions, subjectActions } from "./dexieActions";
import { Center, localDb } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/center`;

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
  async SaveToServer(center: Center) {
    try {
      // ✅ Fetch all subjects for this center (exclude deleted)
      const allSubjects = await subjectActions.getAll();
      const centerSubjects = allSubjects
        .filter(s => s.centerId === center.id && s.status !== '0')
        .map(s => ({
          centerId: s.centerId,
          name: s.name,
          grade: s.grade,
          price: s.price,
          duration: s.duration,
        }));

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
          subjects: centerSubjects, // ✅ Include actual subjects
          createdAt: new Date(center.createdAt).toISOString(),
          updatedAt: new Date(center.updatedAt).toISOString(),
        }),
      });

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
            subjects: centerSubjects, // ✅ Include subjects in PATCH too
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

  // ✅ Optimized sync with bulk operations
  async Sync() {
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    const { waiting, pending } = await centerActions.getSyncTargets();
    
    if (waiting.length === 0 && pending.length === 0) {
      return { message: "No centers to sync.", results: [] };
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // ✅ Process deletions in parallel
    if (pending.length > 0) {
      const deleteResults = await Promise.allSettled(
        pending.map(center => ServerActionCenters.DeleteFromServer(center.id))
      );

      const successfulDeletes: string[] = [];
      
      deleteResults.forEach((result, index) => {
        const center = pending[index];
        if (result.status === 'fulfilled' && result.value?.ok) {
          successfulDeletes.push(center.id);
          results.push({ id: center.id, success: true });
        } else {
          const error = result.status === 'rejected' ? result.reason : 'Server error';
          results.push({ id: center.id, success: false, error });
        }
      });

      // ✅ Bulk delete from local DB
      if (successfulDeletes.length > 0) {
        await centerActions.bulkDeleteLocal(successfulDeletes);
      }
    }

    // ✅ Process updates in parallel
    if (waiting.length > 0) {
      const updateResults = await Promise.allSettled(
        waiting.map(center => ServerActionCenters.SaveToServer(center))
      );

      const successfulUpdates: string[] = [];
      
      updateResults.forEach((result, index) => {
        const center = waiting[index];
        if (result.status === 'fulfilled' && result.value) {
          successfulUpdates.push(center.id);
          results.push({ id: center.id, success: true });
        } else {
          const error = result.status === 'rejected' ? result.reason : 'Server error';
          results.push({ id: center.id, success: false, error });
        }
      });

      // ✅ Bulk mark as synced
      if (successfulUpdates.length > 0) {
        await centerActions.bulkMarkSynced(successfulUpdates);
        
        // ✅ Also mark subjects as synced for successfully synced centers
        const allSubjects = await subjectActions.getAll();
        const subjectsToMarkSynced = allSubjects.filter(s => 
          successfulUpdates.includes(s.centerId) && s.status === 'w'
        );
        
        if (subjectsToMarkSynced.length > 0) {
          await Promise.all(
            subjectsToMarkSynced.map(subject => 
              subjectActions.putLocal({
                ...subject,
                status: '1' as const,
                updatedAt: Date.now(),
              })
            )
          );
        }
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

  // ✅ Optimized import with bulk operations and transaction
  async ImportFromServer() {
    if (!isOnline()) {
      throw new Error("Cannot import: device is offline");
    }

    try {
      const data = await ServerActionCenters.ReadFromServer();
      const transformedCenters = Array.isArray(data) 
        ? data.map((center: any) => transformServerCenter(center))
        : [];
      
      // ✅ Use transaction for atomicity
      await localDb.transaction('rw', localDb.centers, async () => {
        // Get existing synced centers
        const syncedCenters = await centerActions.getByStatus(["1"]);
        const syncedIds = syncedCenters.map(c => c.id);
        
        // Delete old synced records
        if (syncedIds.length > 0) {
          await centerActions.bulkDeleteLocal(syncedIds);
        }
        
        // Bulk insert new records
        if (transformedCenters.length > 0) {
          await centerActions.bulkPutLocal(transformedCenters);
        }
      });
      
      return { 
        message: `Imported ${transformedCenters.length} centers from server.`, 
        count: transformedCenters.length 
      };
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionCenters;

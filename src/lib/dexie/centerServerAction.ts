/* eslint-disable @typescript-eslint/no-explicit-any */
import { centerActions, subjectActions } from "./dexieActions";
import { Center, localDb } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

function getApiUrl(pathname: string) {
  // In the browser, prefer relative URLs so we always hit the current origin.
  // This avoids broken sync when NEXT_PUBLIC_BASE_URL is not set or is incorrect.
  if (typeof window !== "undefined") {
    return pathname;
  }
  return `${baseUrl}${pathname}`;
}

const api_url = getApiUrl("/api/center");
const subjects_api_url = getApiUrl("/api/subjects");

function transformServerCenter(serverCenter: any): Center {
  return {
    id: serverCenter.id,
    name: serverCenter.name,
    address: serverCenter.address || undefined,
    phone: serverCenter.phone || undefined,
    classrooms: Array.isArray(serverCenter.classrooms)
      ? serverCenter.classrooms
      : [],
    workingDays: Array.isArray(serverCenter.workingDays)
      ? serverCenter.workingDays
      : [],
    workingMonths: Array.isArray(serverCenter.workingMonths)
      ? serverCenter.workingMonths
      : [],
    workingYears: Array.isArray(serverCenter.workingYears)
      ? serverCenter.workingYears
      : [],
    managers: Array.isArray(serverCenter.managers) ? serverCenter.managers : [],
    adminId: serverCenter.adminId,
    status: "1" as const,
    createdAt:
      typeof serverCenter.createdAt === "string"
        ? new Date(serverCenter.createdAt).getTime()
        : serverCenter.createdAt || Date.now(),
    updatedAt:
      typeof serverCenter.updatedAt === "string"
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
        .filter((s) => s.centerId === center.id && s.status !== "0")
        .map((s) => ({
          id: s.id, // ✅ Include subject ID
          centerId: s.centerId,
          name: s.name,
          grade: s.grade,
          price: s.price,
          duration: s.duration,
          createdAt: new Date(s.createdAt).toISOString(),
          updatedAt: new Date(s.updatedAt).toISOString(),
        }));

      const requestBody = {
        id: center.id,
        name: center.name,
        address: center.address || null,
        phone: center.phone || null,
        classrooms: center.classrooms || [],
        workingDays: center.workingDays || [],
        workingMonths: center.workingMonths || [],
        workingYears: center.workingYears || [],
        paymentStartDay: center.paymentStartDay,
        paymentEndDay: center.paymentEndDay,
        subjects: centerSubjects,
        adminId: center.adminId, // ✅ Include adminId for API route compatibility
        createdAt: new Date(center.createdAt).toISOString(),
        updatedAt: new Date(center.updatedAt).toISOString(),
      };

      console.log("🔄 Syncing center to server:", {
        centerId: center.id,
        name: center.name,
        subjectsCount: centerSubjects.length,
        method: "server-action",
        requestBody: {
          ...requestBody,
          // Log first 100 chars of each field to avoid huge logs
          subjects: requestBody.subjects?.map((s: any) => ({
            id: s.id,
            name: s.name,
          })),
        },
      });

      // Validate ObjectId format before sending
      if (!/^[0-9a-fA-F]{24}$/.test(center.id)) {
        throw new Error(
          `Invalid center ID format: ${center.id}. Must be a valid MongoDB ObjectId (24 hex characters)`,
        );
      }

      // ✅ Try server action first (direct Prisma access - faster)
      try {
        const { saveCenterToDatabase } =
          await import("@/lib/actions/centerActions");
        const result = await saveCenterToDatabase(requestBody);

        if (result.success) {
          console.log(
            "✅ Center synced successfully via server action:",
            result.data,
          );
          return result.data;
        } else {
          throw new Error("Server action returned unsuccessful result");
        }
      } catch (serverActionError: any) {
        const errorMsg =
          serverActionError?.message ||
          serverActionError?.toString() ||
          "Unknown server action error";
        console.warn("⚠️ Server action failed, falling back to API:", errorMsg);
        console.warn("⚠️ Server action error details:", {
          message: errorMsg,
          name: serverActionError?.name,
          code: serverActionError?.code,
          // Only log stack in development
          ...(process.env.NODE_ENV === "development" && {
            stack: serverActionError?.stack,
          }),
        });
        // Fall through to API route
      }

      // ✅ Fallback to API route
      // Ensure adminId is included for API route compatibility
      const apiRequestBody = {
        ...requestBody,
        adminId: center.adminId, // ✅ Explicitly include adminId for API route
      };

      // Validate adminId exists
      if (!apiRequestBody.adminId) {
        throw new Error(
          "Center adminId is required but missing. Cannot sync center without adminId.",
        );
      }

      let response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(apiRequestBody),
      });

      if (!response.ok && response.status === 409) {
        console.log("⚠️ Center exists, trying PATCH...");
        // PATCH endpoint doesn't handle subjects, so we only update center fields
        response = await fetch(api_url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            centerId: center.id,
            name: center.name,
            address: center.address || null,
            phone: center.phone || null,
            classrooms: center.classrooms || [],
            workingDays: center.workingDays || [],
            workingMonths: center.workingMonths || [],
            workingYears: center.workingYears || [],
            paymentStartDay: center.paymentStartDay,
            paymentEndDay: center.paymentEndDay,
            updatedAt: new Date(center.updatedAt).toISOString(),
          }),
        });

        // After PATCH, we need to sync subjects separately via POST to /api/subjects
        if (response.ok && centerSubjects.length > 0) {
          console.log("🔄 Syncing subjects separately...");
          try {
            const subjectSyncResults = await Promise.allSettled(
              centerSubjects.map((subject) =>
                fetch(subjects_api_url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    id: subject.id,
                    centerId: center.id,
                    name: subject.name,
                    grade: subject.grade,
                    price: subject.price,
                    duration: subject.duration,
                    createdAt: subject.createdAt,
                    updatedAt: subject.updatedAt,
                  }),
                }),
              ),
            );

            const failedSubjects = subjectSyncResults
              .map((result, index) => ({
                result,
                subject: centerSubjects[index],
              }))
              .filter(
                ({ result }) =>
                  result.status === "rejected" ||
                  (result.status === "fulfilled" && !result.value.ok),
              );

            if (failedSubjects.length > 0) {
              console.warn("⚠️ Some subjects failed to sync:", failedSubjects);
            } else {
              console.log("✅ All subjects synced successfully");
            }
          } catch (subjectError) {
            console.error("❌ Error syncing subjects:", subjectError);
            // Don't throw - center was updated successfully
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        const errorMessage =
          errorData.error?.message ||
          errorData.error ||
          `HTTP ${response.status}: ${errorText}`;
        console.error("❌ Center sync failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          centerId: center.id,
        });
        throw new Error(`HTTP Error: ${response.status} - ${errorMessage}`);
      }

      const result = await response.json();
      console.log("✅ Center synced successfully via API:", result);
      return result;
    } catch (e) {
      console.error("❌ Error saving center to server:", e);
      throw e; // ✅ Re-throw to let sync handler know it failed
    }
  },

  async DeleteFromServer(id: string) {
    try {
      // ✅ Try server action first (direct Prisma access - faster)
      try {
        const { deleteCenterFromDatabase } =
          await import("@/lib/actions/centerActions");
        const result = await deleteCenterFromDatabase(id);

        if (result.success) {
          console.log("✅ Center deleted successfully via server action");
          return { ok: true } as Response;
        }
      } catch (serverActionError: any) {
        console.warn(
          "⚠️ Server action failed, falling back to API:",
          serverActionError?.message,
        );
        // Fall through to API route
      }

      // ✅ Fallback to API route
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

    console.log("🔄 [Center Sync] Starting sync...");
    const { waiting, pending } = await centerActions.getSyncTargets();

    console.log("🔄 [Center Sync] Found:", {
      waiting: waiting.length,
      pending: pending.length,
      waitingIds: waiting.map((c) => c.id),
      pendingIds: pending.map((c) => c.id),
    });

    if (waiting.length === 0 && pending.length === 0) {
      console.log("ℹ️ [Center Sync] No centers to sync");
      return { message: "No centers to sync.", results: [] };
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // ✅ Process deletions in parallel
    if (pending.length > 0) {
      const deleteResults = await Promise.allSettled(
        pending.map((center) =>
          ServerActionCenters.DeleteFromServer(center.id),
        ),
      );

      const successfulDeletes: string[] = [];

      deleteResults.forEach((result, index) => {
        const center = pending[index];
        if (result.status === "fulfilled" && result.value?.ok) {
          successfulDeletes.push(center.id);
          results.push({ id: center.id, success: true });
        } else {
          const error =
            result.status === "rejected" ? result.reason : "Server error";
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
        waiting.map((center) => ServerActionCenters.SaveToServer(center)),
      );

      const successfulUpdates: string[] = [];

      updateResults.forEach((result, index) => {
        const center = waiting[index];
        if (result.status === "fulfilled" && result.value) {
          successfulUpdates.push(center.id);
          results.push({ id: center.id, success: true });
        } else {
          let errorMessage = "Server error";
          if (result.status === "rejected") {
            errorMessage =
              result.reason?.message ||
              result.reason?.toString() ||
              "Unknown error";
            console.error(
              `[Center Sync] Failed to sync center ${center.id}:`,
              result.reason,
            );
          } else if (result.status === "fulfilled" && !result.value) {
            errorMessage = "Server returned no data";
            console.error(
              `[Center Sync] Server returned no data for center ${center.id}`,
            );
          }
          results.push({ id: center.id, success: false, error: errorMessage });
        }
      });

      // ✅ Bulk mark as synced
      if (successfulUpdates.length > 0) {
        await centerActions.bulkMarkSynced(successfulUpdates);

        // ✅ Also mark subjects as synced for successfully synced centers
        const allSubjects = await subjectActions.getAll();
        const subjectsToMarkSynced = allSubjects.filter(
          (s) => successfulUpdates.includes(s.centerId) && s.status === "w",
        );

        if (subjectsToMarkSynced.length > 0) {
          await Promise.all(
            subjectsToMarkSynced.map((subject) =>
              subjectActions.putLocal({
                ...subject,
                status: "1" as const,
                updatedAt: Date.now(),
              }),
            ),
          );
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log("✅ [Center Sync] Completed:", {
      successCount,
      failCount,
      results,
    });

    return {
      message: `Center sync completed. ${successCount} succeeded, ${failCount} failed.`,
      results,
      successCount,
      failCount,
    };
  },

  async ReadFromServer() {
    try {
      // ✅ Try server action first (direct Prisma access - faster)
      try {
        const { getCentersFromDatabase } =
          await import("@/lib/actions/centerActions");
        const result = await getCentersFromDatabase();

        if (result.success) {
          console.log("✅ Centers fetched successfully via server action");
          return result.data;
        }
      } catch (serverActionError: any) {
        console.warn(
          "⚠️ Server action failed, falling back to API:",
          serverActionError?.message,
        );
        // Fall through to API route
      }

      // ✅ Fallback to API route
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
      const transformedCenters = Array.isArray(data)
        ? data.map((center: any) => transformServerCenter(center))
        : [];

      // ✅ Use transaction for atomicity
      await localDb.transaction("rw", localDb.centers, async () => {
        // ✅ Get pending local changes that should NOT be overwritten
        const pendingCenters = await centerActions.getByStatus(["w", "0"]);
        const pendingIds = new Set(pendingCenters.map((c) => c.id));

        // Get existing synced centers
        const syncedCenters = await centerActions.getByStatus(["1"]);
        const syncedIds = syncedCenters.map((c) => c.id);

        // Delete old synced records
        if (syncedIds.length > 0) {
          await centerActions.bulkDeleteLocal(syncedIds);
        }

        // ✅ Filter out centers that have pending local changes to preserve them
        const safeToImport = transformedCenters.filter(
          (c) => !pendingIds.has(c.id),
        );

        // Bulk insert only non-conflicting records
        if (safeToImport.length > 0) {
          await centerActions.bulkPutLocal(safeToImport);
        }

        if (pendingIds.size > 0) {
          console.log(
            `[ImportFromServer] Preserved ${pendingIds.size} center(s) with pending local changes`,
          );
        }
      });

      return {
        message: `Imported ${transformedCenters.length} centers from server.`,
        count: transformedCenters.length,
      };
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  },
};

export default ServerActionCenters;

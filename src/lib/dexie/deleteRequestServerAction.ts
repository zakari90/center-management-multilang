/* eslint-disable @typescript-eslint/no-explicit-any */
// deleteRequestServerAction.ts

import { deleteRequestActions } from "./dexieActions";
import { DeleteRequest, DeleteRequestStatus } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

function getApiUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return pathname;
  }
  return `${baseUrl}${pathname}`;
}

const api_url = getApiUrl("/api/manager/delete-request");

const ServerActionDeleteRequests = {
  // ✅ Save delete request to server
  async SaveToServer(request: DeleteRequest) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entityId: request.entityId,
          entityType: request.entityType,
          entityName: request.entityName,
          reason: request.reason,
          requestedBy: request.requestedBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP Error: ${response.status} - ${errorData.error || "Unknown error"}`,
        );
      }
      return response.json();
    } catch (e) {
      console.error("Error saving delete request to server:", e);
      return null;
    }
  },

  async Sync() {
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping delete request sync");
        return {
          message: "Cannot sync: offline",
          results: [],
          successCount: 0,
          failCount: 0,
        };
      }

      // Get pending requests (status "w" for waiting)
      const waitingData = await deleteRequestActions.getByStatus(["w"]);
      if (waitingData.length === 0)
        return {
          message: "No delete requests to sync.",
          results: [],
          successCount: 0,
          failCount: 0,
        };

      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];

      for (const request of waitingData) {
        try {
          const result = await ServerActionDeleteRequests.SaveToServer(request);
          if (result && result.success) {
            // Update local record to synced
            await deleteRequestActions.update(request.id, {
              status: "1",
              updatedAt: Date.now(),
              // Optionally update ID if server returns the real MongoDB ID
              ...(result.data?.id && { id: result.data.id }),
            });
            results.push({ id: request.id, success: true });
          } else {
            results.push({
              id: request.id,
              success: false,
              error: "Server request failed",
            });
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`Error syncing delete request ${request.id}:`, error);
          results.push({ id: request.id, success: false, error: errorMsg });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      return {
        message: `Delete requests sync completed. ${successCount} succeeded, ${failCount} failed.`,
        results,
        successCount,
        failCount,
      };
    } catch (globalError: any) {
      console.error(
        "Critical error in ServerActionDeleteRequests.Sync:",
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
};

export default ServerActionDeleteRequests;

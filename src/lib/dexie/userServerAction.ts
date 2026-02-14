/* eslint-disable @typescript-eslint/no-explicit-any */
// userServerAction.ts

import { userActions } from "./dexieActions";
import { User, Role, localDb } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

function getApiUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return pathname;
  }
  return `${baseUrl}${pathname}`;
}

const api_url = getApiUrl("/api/admin/users");

// ✅ Transform server user data to match local User interface
function transformServerUser(serverUser: any): User {
  return {
    id: serverUser.id,
    email: serverUser.email,
    password: serverUser.password || "",
    name: serverUser.name,
    role: (serverUser.role || "MANAGER").toUpperCase() as Role,
    status: "1" as const,
    createdAt:
      typeof serverUser.createdAt === "string"
        ? new Date(serverUser.createdAt).getTime()
        : serverUser.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

const ServerActionUsers = {
  // ✅ Save user to server (handles both create and update)
  async SaveToServer(user: User) {
    try {
      // Try POST first (create) for all roles
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          password: user.password,
        }),
      });

      if (!response.ok && response.status === 409) {
        // If conflict (email or ID exists), try update via path-based endpoint
        const updateResponse = await fetch(`${api_url}/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role,
            password: user.password,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          throw new Error(
            `HTTP Error: ${updateResponse.status} - ${errorData.error || "Unknown error"}`,
          );
        }
        return updateResponse.json();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || "Unknown error"}`,
        );
      }
      return response.json();
    } catch (e) {
      console.error("Error saving user to server:", e);
      return null;
    }
  },

  async createOrUpdateUser(user: any) {
    return this.SaveToServer(user);
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
      console.error("Error deleting user from server:", e);
      return null;
    }
  },

  async softDeleteUser(id: string) {
    return this.DeleteFromServer(id);
  },

  async Sync() {
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping user sync");
        return {
          message: "Cannot sync: offline",
          results: [],
          successCount: 0,
          failCount: 0,
        };
      }

      const waitingData = await userActions.getByStatus(["0", "w"]);
      if (waitingData.length === 0)
        return {
          message: "No users to sync.",
          results: [],
          successCount: 0,
          failCount: 0,
        };

      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];

      for (const user of waitingData) {
        try {
          if (user.status === "0") {
            // Pending deletion
            const result = await ServerActionUsers.DeleteFromServer(user.id);
            if (result && result.ok) {
              await userActions.deleteLocal(user.id);
              results.push({ id: user.id, success: true });
            } else {
              const errorMsg = result
                ? `Server returned ${result.status}`
                : "Network error";
              results.push({ id: user.id, success: false, error: errorMsg });
            }
          } else if (user.status === "w") {
            // Waiting to sync
            const result = await ServerActionUsers.SaveToServer(user);
            if (result) {
              user.status = "1"; // Mark as synced
              await userActions.putLocal({
                ...user,
                ...(result.id && { id: result.id }),
                ...(result.name && { name: result.name }),
                ...(result.email && { email: result.email }),
                status: "1" as const,
                updatedAt: Date.now(),
              });
              results.push({ id: user.id, success: true });
            } else {
              results.push({
                id: user.id,
                success: false,
                error: "Server request failed",
              });
            }
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`Error syncing user ${user.id}:`, error);
          results.push({ id: user.id, success: false, error: errorMsg });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      return {
        message: `User sync completed. ${successCount} succeeded, ${failCount} failed.`,
        results,
        successCount,
        failCount,
      };
    } catch (globalError: any) {
      console.error("Critical error in ServerActionUsers.Sync:", globalError);
      return {
        message: "Sync failed completely",
        results: [],
        successCount: 0,
        failCount: 1, // Treat as 1 failure to ensure it's logged
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
    try {
      if (!isOnline()) {
        console.warn("Device is offline, skipping import");
        return { message: "Cannot import: offline", count: 0, failCount: 0 };
      }

      const data = await ServerActionUsers.ReadFromServer();

      // Transform and save data
      const transformedUsers = Array.isArray(data)
        ? data.map((user: any) => transformServerUser(user))
        : [];

      // We don't delete everything blindly if we might have local pending changes?
      // The original logic deleted sync'd users. We should preserve that behavior but be careful.
      const syncedUsers = await userActions.getByStatus(["1"]);

      await localDb.transaction("rw", localDb.users, async () => {
        // Delete only synced users to avoid losing local work
        for (const user of syncedUsers) {
          await userActions.deleteLocal(user.id);
        }

        for (const user of transformedUsers) {
          const existing = await userActions.getLocal(user.id);
          // Don't overwrite pending changes
          if (
            existing &&
            (existing.status === "w" || existing.status === "0")
          ) {
            continue;
          }
          await userActions.putLocal(user);
        }
      });

      return {
        message: `Imported ${transformedUsers.length} users from server.`,
        count: transformedUsers.length,
        failCount: 0,
      };
    } catch (error: any) {
      console.error("Error importing users from server:", error);
      return {
        message: "Import failed",
        count: 0,
        failCount: 1,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export default ServerActionUsers;

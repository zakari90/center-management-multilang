/* eslint-disable @typescript-eslint/no-explicit-any */
// userServerAction.ts

import { userActions } from "./dexieActions";
import { User, Role } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const api_url = `${baseUrl}/api/admin/users`;
const managerRegisterUrl = `${baseUrl}/api/manager/register`;

// ✅ Transform server user data to match local User interface
function transformServerUser(serverUser: any): User {
  return {
    id: serverUser.id,
    email: serverUser.email,
    password: serverUser.password || "",
    name: serverUser.name,
    role: (serverUser.role || "MANAGER").toUpperCase() as Role,
    status: '1' as const,
    createdAt: typeof serverUser.createdAt === 'string'
      ? new Date(serverUser.createdAt).getTime()
      : serverUser.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

const ServerActionUsers = {
  // ✅ Save user to server (handles both create and update)
  async SaveToServer(user: User) {
    try {
      // For managers, use manager register endpoint
      if (user.role === Role.MANAGER) {
        const response = await fetch(managerRegisterUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: user.email,
            password: user.password,
            username: user.name,
            id: user.id,
          }),
        });
        if (!response.ok) {
          // If conflict, try update via admin endpoint
          if (response.status === 409) {
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
              throw new Error(`HTTP Error: ${updateResponse.status} - ${errorData.error || 'Unknown error'}`);
            }
            return updateResponse.json();
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
        }
        return response.json();
      } else {
        // For admins, use admin users endpoint
        const response = await fetch(api_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role,
            password: user.password,
          }),
        });
        if (!response.ok && response.status === 409) {
          // Try update
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
            throw new Error(`HTTP Error: ${updateResponse.status} - ${errorData.error || 'Unknown error'}`);
          }
          return updateResponse.json();
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
        return response.json();
      }
    } catch (e) {
      console.error("Error saving user to server:", e);
      return null;
    }
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

  async Sync() {
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    const waitingData = await userActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No users to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const user of waitingData) {
      try {
        if (user.status === "0") {
          // Pending deletion
          const result = await ServerActionUsers.DeleteFromServer(user.id);
          if (result && result.ok) {
            await userActions.deleteLocal(user.id);
            results.push({ id: user.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
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
              status: '1' as const,
              updatedAt: Date.now(),
            });
            results.push({ id: user.id, success: true });
          } else {
            results.push({ id: user.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing user ${user.id}:`, error);
        results.push({ id: user.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `User sync completed. ${successCount} succeeded, ${failCount} failed.`,
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
      const data = await ServerActionUsers.ReadFromServer();
      const syncedUsers = await userActions.getByStatus(["1"]);
      const backup = [...syncedUsers];
      
      try {
        for (const user of syncedUsers) {
          await userActions.deleteLocal(user.id);
        }
        
        const transformedUsers = Array.isArray(data) 
          ? data.map((user: any) => transformServerUser(user))
          : [];
        for (const user of transformedUsers) {
          const existing = await userActions.getLocal(user.id);
          if (existing && existing.status === 'w') {
            continue; // Don't overwrite local pending changes
          }
          await userActions.putLocal(user);
        }
        
        return { message: `Imported ${transformedUsers.length} users from server.`, count: transformedUsers.length };
      } catch (error) {
        console.error("Error during import, restoring backup:", error);
        for (const user of backup) {
          await userActions.putLocal(user);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionUsers;

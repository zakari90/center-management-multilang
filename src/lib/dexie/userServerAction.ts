/* eslint-disable @typescript-eslint/no-explicit-any */
// ServerActionUsers.ts

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
    password: serverUser.password || "", // Server may not return password
    name: serverUser.name,
    role: (serverUser.role || "MANAGER").toUpperCase() as Role,
    status: '1' as const, // Imported users are synced
    createdAt: typeof serverUser.createdAt === 'string'
      ? new Date(serverUser.createdAt).getTime()
      : serverUser.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

const ServerActionUsers = {
  // ✅ Create new user on server (for managers)
  async CreateOnServer(user: User) {
    try {
      const response = await fetch(managerRegisterUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: user.password, // Note: API expects plain password
          username: user.name,
          id: user.id, // Use client-provided ID for offline-first
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating user on server:", e);
      return null;
    }
  },

  // ✅ Update existing user on server
  async UpdateOnServer(user: User) {
    try {
      const response = await fetch(`${api_url}/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          password: user.password, // Include password if it was updated
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error updating user on server:", e);
      return null;
    }
  },

  // ✅ Check if user exists on server
  async CheckUserExists(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${api_url}`);
      if (!response.ok) return false;
      const users = await response.json();
      return users.some((u: any) => u.id === id);
    } catch (e) {
      console.error("Error checking user existence:", e);
      return false;
    }
  },

  // ✅ Commented out - replaced with CreateOnServer and UpdateOnServer
  // async SaveToServer(user: any) {
  //   try {
  //     const response = await fetch(api_url, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(user),
  //     });
  //     if (!response.ok) throw new Error("HTTP Error: " + response.status);
  //     return response.json();
  //   } catch (e) {
  //     console.log(e);
  //     return null;
  //   }
  // },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${api_url}/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      return response;
    } catch (e) {
      console.error("Error deleting user from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all users with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await userActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No users to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const user of waitingData) {
      try {
        if (user.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionUsers.DeleteFromServer(user.id);
          if (result && result.ok) {
            await userActions.deleteLocal(user.id);
            results.push({ id: user.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: user.id, success: false, error: errorMsg });
          }
        } else if (user.status === "w") {
          // ✅ Waiting to sync: check if user exists, then create or update
          const exists = await ServerActionUsers.CheckUserExists(user.id);
          let result;
          
          if (exists) {
            // User exists on server, update it
            result = await ServerActionUsers.UpdateOnServer(user);
          } else {
            // New user, create it
            result = await ServerActionUsers.CreateOnServer(user);
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await userActions.markSynced(user.id);
            // ✅ Update local user with server response data if available
            if (result.user) {
              await userActions.putLocal({
                ...user,
                ...(result.user.id && { id: result.user.id }),
                ...(result.user.name && { name: result.user.name }),
                ...(result.user.email && { email: result.user.email }),
                ...(result.user.role && { role: result.user.role as Role }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: user.id, success: true });
          } else {
            results.push({ id: user.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
        // ✅ Continue with next user instead of stopping
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
      const data = await ServerActionUsers.ReadFromServer();
      
      // ✅ Store synced users as backup before deletion
      const syncedUsers = await userActions.getByStatus(["1"]);
      const backup = [...syncedUsers];
      
      try {
        // ✅ Delete all synced users to avoid duplicates
        for (const user of syncedUsers) {
          await userActions.deleteLocal(user.id);
        }
        
        // ✅ Insert all users from server with proper transformation
        const transformedUsers = data.map((user: any) => transformServerUser(user));
        // Use bulkPutLocal for better performance
        for (const user of transformedUsers) {
          await userActions.putLocal(user);
        }
        
        return { message: `Imported ${transformedUsers.length} users from server.`, count: transformedUsers.length };
      } catch (error) {
        // ✅ Restore backup on failure
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

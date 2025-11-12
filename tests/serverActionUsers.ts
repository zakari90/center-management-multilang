/* eslint-disable @typescript-eslint/no-explicit-any */
// ServerActionUsers.ts

import { userActions } from "./dexieActions";

const api_url = process.env.NEXT_PUBLIC_BASE_URL + "/api/admin/users";

const ServerActionUsers = {
  async SaveToServer(user: any) {
    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (!response.ok) throw new Error("HTTP Error: " + response.status);
      return response.json();
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async DeleteFromServer(id: string) {
    return fetch(`${api_url}/${id}`, { method: "DELETE" });
  },

  async Sync() {
    // Get all users with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await userActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return "No users to sync.";

    for (const user of waitingData) {
      let result;
      if (user.status === "0") {
        // Pending deletion: remove on server and then local
        result = await ServerActionUsers.DeleteFromServer(user.id!);
        if (result && result.ok) {
          await userActions.deleteLocal(user.id!);
        }
      } else if (user.status === "w") {
        // Waiting to sync: upload to server
        result = await ServerActionUsers.SaveToServer(user);
        if (result) {
          // Mark as synced if server accepted
          await userActions.markSynced(user.id!);
        }
      }

      // If server request failed, throw error
      if (!result || result.ok === false) {
        throw new Error("Error syncing user " + user.id);
      }
    }
    return "User sync completed successfully.";
  },

  async ReadFromServer() {
    const res = await fetch(api_url);
    if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
    return res.json();
  },

  async ImportFromServer() {
    const data = await ServerActionUsers.ReadFromServer();
    
    // Delete all synced users to avoid duplicates
    const syncedUsers = await userActions.getByStatus(["1"]);
    for (const user of syncedUsers) {
      await userActions.deleteLocal(user.id);
    }
    
    // Insert all users from server
    for (const user of data) {
      await userActions.putLocal(user);
    }
  }
};

export default ServerActionUsers;

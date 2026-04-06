import { freeLocalDb, Role } from "./dbSchema";

export const freeLocalActions = {
  /**
   * Initializes the basic free setup: 
   * A single local admin and a single local center.
   */
  async initFreeSetup(centerName: string, adminName: string) {
    try {
      const adminCount = await freeLocalDb.localAuthUsers.count();
      if (adminCount === 0) {
        // Build the basic "local-admin" ID
        const currentMs = Date.now();
        // Create an unencrypted local user
        await freeLocalDb.localAuthUsers.add({
          id: "local-admin",
          email: "local",
          passwordHash: "", // No encryption needed for local mode
          name: adminName || "مدير محلي",
          role: Role.ADMIN,
          isEncrypted: false,
          lastOnlineLogin: currentMs,
          createdAt: currentMs,
          updatedAt: currentMs,
        });

        // Create the basic local center linked to the local admin
        await freeLocalDb.centers.add({
          id: "local-center",
          adminId: "local-admin",
          name: centerName || "المركز المحلي",
          status: "1", // Pretend it's synced so UI doesn't try to sync it
          classrooms: [],
          workingDays: [],
          managers: ["local-admin"],
          createdAt: currentMs,
          updatedAt: currentMs,
        });

        return { success: true, message: "Free setup initialized successfully" };
      }
      return { success: true, message: "Already initialized" };
    } catch (e) {
      console.error("Failed to initialize free setup:", e);
      return { success: false, message: "Initialization failed" };
    }
  },

  /**
   * Checks if an admin exists in the free local DB
   */
  async hasAdmin() {
    const count = await freeLocalDb.localAuthUsers.where("role").equals(Role.ADMIN).count();
    return count > 0;
  },

  /**
   * Retrieves the local admin directly. Used for auto-login or simple access.
   */
  async getLocalAdmin() {
    return await freeLocalDb.localAuthUsers.get("local-admin");
  },

  /**
   * Deletes the local setup (useful for testing or full reset in free mode)
   */
  async deleteSetup() {
    await freeLocalDb.localAuthUsers.clear();
    await freeLocalDb.centers.clear();
    return { success: true };
  }
};

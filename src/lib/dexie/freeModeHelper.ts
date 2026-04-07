import { localDb, Role, User } from "./dbSchema";

/**
 * Initializes the free mode environment in Dexie.
 * Sets the 'isFreeMode' flag in localStorage and creates a default center and admin user.
 * 
 * @param loginFn - The login function from AuthContext to log the user in locally.
 */
export async function initializeFreeModeEnvironment(login: (user: User) => Promise<void>) {
  try {
    // 1. Set free mode flag
    localStorage.setItem("isFreeMode", "true");
    
    // 2. Clear current database to ensure a clean start if switching modes
    // Dexie will re-open with the correct name due to the change in getDatabaseName()
    // However, since handleStartFree will reload the page, we just need to ensure
    // the data is there when it re-opens.
    
    const centerId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const now = Date.now();
    
    // Create Default Center
    await localDb.centers.put({
      id: centerId,
      name: "My Local Center",
      address: "Offline Mode",
      phone: "0000000000",
      classrooms: ["Classroom 1"],
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      managers: [],
      adminId: adminId,
      status: "1",
      createdAt: now,
      updatedAt: now,
    });

    // Create Local Admin User
    const adminUser: User = {
      id: adminId,
      email: "free@local.app",
      password: "", // No password needed for local free access
      name: "Local Admin",
      role: Role.ADMIN,
      status: "1",
      createdAt: now,
      updatedAt: now,
    };
    
    await localDb.users.put(adminUser);

    // 3. Login the user
    await login(adminUser);

    return true;
  } catch (error) {
    console.error("Failed to initialize free mode environment:", error);
    throw error;
  }
}

/**
 * Checks if the application is currently in free mode.
 */
export function isFreeModeActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isFreeMode") === "true";
}

/**
 * Exits free mode by clearing the flag and logging out.
 */
export function exitFreeMode() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isFreeMode");
  }
}

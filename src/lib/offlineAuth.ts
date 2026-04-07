/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Offline Authentication Service
 *
 * Manages local credential storage for offline-first PWA authentication.
 * After a successful online login, credentials are stored locally (with hashed password)
 * to allow offline logins on subsequent visits.
 */

import { localDb, LocalAuthUser, Role } from "./dexie/dbSchema";
import bcrypt from "bcryptjs";

export interface OfflineAuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}

/**
 * Save user credentials locally after successful online login
 * @param user - User object from server response
 * @param passwordHash - The bcrypt hash from server (NOT plain password)
 */
export async function saveCredentialsLocally(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  },
  passwordHash: string,
): Promise<void> {
  try {
    const now = Date.now();

    const localAuthUser: LocalAuthUser = {
      id: user.id,
      email: user.email.toLowerCase(),
      passwordHash: passwordHash,
      name: user.name,
      role: user.role as Role,
      lastOnlineLogin: now,
      createdAt: now,
      updatedAt: now,
    };

    // Use put to upsert (insert or update)
    await localDb.localAuthUsers.put(localAuthUser);
  } catch (error) {
    console.error("[OfflineAuth] Failed to save credentials locally:", error);
    throw error;
  }
}

/**
 * Validate login credentials against locally stored data
 * Used for offline login
 * @param email - User email
 * @param password - Plain text password to validate
 */
export async function validateOfflineLogin(
  email: string,
  password: string,
): Promise<OfflineAuthResult> {
  try {
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const localUser = await localDb.localAuthUsers
      .where("email")
      .equals(normalizedEmail)
      .first();

    if (!localUser) {
      return {
        success: false,
        error: "No offline credentials available. Please login online first.",
      };
    }

    // Validate password against stored hash
    const isValid = await bcrypt.compare(password, localUser.passwordHash);

    if (!isValid) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    return {
      success: true,
      user: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      },
    };
  } catch (error) {
    console.error("[OfflineAuth] Offline login error:", error);
    return {
      success: false,
      error: "Failed to validate offline credentials",
    };
  }
}

/**
 * Check if a user has offline credentials stored
 * @param email - User email to check
 */
export async function hasLocalCredentials(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase();
    const count = await localDb.localAuthUsers
      .where("email")
      .equals(normalizedEmail)
      .count();
    return count > 0;
  } catch (error) {
    console.error("[OfflineAuth] Error checking local credentials:", error);
    return false;
  }
}

/**
 * Get local user by email (without password validation)
 * @param email - User email
 */
export async function getLocalUser(
  email: string,
): Promise<LocalAuthUser | undefined> {
  try {
    const normalizedEmail = email.toLowerCase();
    return await localDb.localAuthUsers
      .where("email")
      .equals(normalizedEmail)
      .first();
  } catch (error) {
    console.error("[OfflineAuth] Error getting local user:", error);
    return undefined;
  }
}

/**
 * Clear all locally stored credentials
 * Call this on logout if you want to require online login next time
 */
export async function clearAllLocalCredentials(): Promise<void> {
  try {
    await localDb.localAuthUsers.clear();
  } catch (error) {
    console.error("[OfflineAuth] Error clearing local credentials:", error);
  }
}

/**
 * Clear credentials for a specific user
 * @param email - User email to clear
 */
export async function clearLocalCredentials(email: string): Promise<void> {
  try {
    const normalizedEmail = email.toLowerCase();
    await localDb.localAuthUsers
      .where("email")
      .equals(normalizedEmail)
      .delete();
  } catch (error) {
    console.error("[OfflineAuth] Error clearing local credentials:", error);
  }
}

/**
 * Update the last online login timestamp
 * @param email - User email
 */
export async function updateLastOnlineLogin(email: string): Promise<void> {
  try {
    const normalizedEmail = email.toLowerCase();
    const user = await localDb.localAuthUsers
      .where("email")
      .equals(normalizedEmail)
      .first();

    if (user) {
      await localDb.localAuthUsers.update(user.id, {
        lastOnlineLogin: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error("[OfflineAuth] Error updating last online login:", error);
  }
}

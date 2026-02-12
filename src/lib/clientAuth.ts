/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Client-side Authentication Service
 *
 * Orchestrates login flow for offline-first PWA:
 * - Online: Login via server, save credentials locally
 * - Offline: Login against local IndexedDB
 */

import { isOnline } from "./utils/network";
import {
  saveCredentialsLocally,
  validateOfflineLogin,
  hasLocalCredentials,
} from "./offlineAuth";

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
  isOffline?: boolean;
}

/**
 * Unified login function that works both online and offline
 * @param email - User email
 * @param password - User password
 * @param serverLoginFn - Server action function for online login
 */
export async function loginWithOfflineSupport(
  email: string,
  password: string,
  serverLoginFn: (formData: FormData) => Promise<any>,
): Promise<LoginResult> {
  const online = isOnline();

  if (online) {
    // ===== ONLINE LOGIN =====
    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      // Call the server login action
      const result = await serverLoginFn(formData);

      if (result.success && result.data?.user) {
        const user = result.data.user;
        const passwordHash = result.data.passwordHash;

        // Save credentials locally for offline use
        if (passwordHash) {
          try {
            await saveCredentialsLocally(user, passwordHash);
          } catch (e) {
            console.warn("[ClientAuth] Failed to save credentials locally:", e);
            // Don't fail login if local save fails
          }
        }

        return {
          success: true,
          user,
          isOffline: false,
        };
      }

      // Login failed
      return {
        success: false,
        error:
          result.error?.message ||
          result.error?.email ||
          result.error?.password ||
          "Login failed",
        isOffline: false,
      };
    } catch (error: any) {
      console.error("[ClientAuth] Online login error:", error);

      // If network error, try offline login as fallback
      if (error?.message?.includes("fetch") || error?.code === "ERR_NETWORK") {
        return attemptOfflineLogin(email, password);
      }

      return {
        success: false,
        error: error?.message || "Login failed",
        isOffline: false,
      };
    }
  } else {
    // ===== OFFLINE LOGIN =====
    return attemptOfflineLogin(email, password);
  }
}

/**
 * Attempt offline login against local IndexedDB
 */
async function attemptOfflineLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  // Check if user has offline credentials
  const hasCredentials = await hasLocalCredentials(email);

  if (!hasCredentials) {
    return {
      success: false,
      error: "First login requires internet connection",
      isOffline: true,
    };
  }

  // Validate against local store
  const offlineResult = await validateOfflineLogin(email, password);

  if (offlineResult.success && offlineResult.user) {
    return {
      success: true,
      user: offlineResult.user,
      isOffline: true,
    };
  }

  return {
    success: false,
    error: offlineResult.error || "Invalid credentials",
    isOffline: true,
  };
}

/**
 * Check if offline login is available for a user
 */
export async function canLoginOffline(email: string): Promise<boolean> {
  return hasLocalCredentials(email);
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  saveCredentialsLocally,
  validateOfflineLogin,
  hasLocalCredentials,
} from "@/lib/offlineAuth";
import { useTranslations } from "next-intl";
import { isOnline } from "@/lib/utils/network";
import { deriveKey, setGlobalCryptoKey } from "@/lib/utils/crypto";
import { localDb } from "@/lib/dexie/dbSchema";
import {
  checkEpochMismatch,
  clearAllLocalData,
  updateSyncMeta,
  getPendingChangesCount,
} from "@/lib/dexie/clearLocalData";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEncrypted?: boolean;
  encryptionSalt?: string;
}

const LAST_USER_KEY = "last-auth-user";

interface LoginWithServerOptions {
  serverLoginFn: (formData: FormData) => Promise<any>;
  onSuccess?: (user: User, isOffline: boolean) => void;
  onError?: (error: string, isOffline: boolean) => void;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  epochMismatchPending: EpochMismatchInfo | null;
  encryptionKey: CryptoKey | null;
  login: (
    user: User,
    rawPassword?: string,
    passwordHash?: string,
    dataEpoch?: string,
  ) => Promise<void>;
  loginWithCredentials: (
    email: string,
    password: string,
    options: LoginWithServerOptions,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
  canLoginOffline: (email: string) => Promise<boolean>;
  confirmEpochReset: () => Promise<void>;
  cancelEpochReset: () => void;
}

// Epoch mismatch state
interface EpochMismatchInfo {
  pendingChangesCount: number;
  serverEpoch: string;
  userData: User;
  rawPassword?: string;
  passwordHash?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [epochMismatchPending, setEpochMismatchPending] =
    useState<EpochMismatchInfo | null>(null);
  const t = useTranslations("auth"); // Use 'auth' namespace
  const tOffline = useTranslations("offline");

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    // Client-side logout - keep local credentials for future offline login
    setUser(null);
    setEncryptionKey(null);
    setGlobalCryptoKey(null, false);
    setIsOfflineMode(false);
    try {
      localStorage.removeItem(LAST_USER_KEY);
    } catch {}

    // Clear local Dexie database to prevent data leakage between users
    try {
      await Promise.all([
        localDb.centers.clear(),
        localDb.teachers.clear(),
        localDb.students.clear(),
        localDb.subjects.clear(),
        localDb.teacherSubjects.clear(),
        localDb.studentSubjects.clear(),
        localDb.receipts.clear(),
        localDb.schedules.clear(),
        localDb.users.clear(),
        // Note: Keep localAuthUsers for offline login capability
        // Note: Keep pushSubscriptions as they're device-specific
      ]);
    } catch (e) {}

    window.location.href = "/";
  }, []);

  const checkAuth = async () => {
    try {
      // 100% client-side: read from localStorage only
      try {
        const raw = localStorage.getItem(LAST_USER_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;
        if (parsed && typeof parsed === "object") {
          const maybeUser = parsed as User;
          if (maybeUser?.id && maybeUser?.role) {
            // NEW: If online, check if account still exists on server (Session Revocation)
            if (isOnline() && maybeUser.email) {
              try {
                const res = await fetch("/api/auth/check-status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: maybeUser.email }),
                });
                const data = await res.json();

                if (data.exists === false || data.isActive === false) {
                  await logout();
                  return;
                }
              } catch (e) {}
            }

            setUser(maybeUser);

            return;
          }
        }
      } catch {}

      setUser(null);

      return;
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with user data and optionally save credentials for offline
   */
  const login = useCallback(
    async (
      userData: User,
      rawPassword?: string,
      passwordHash?: string,
      dataEpoch?: string,
    ) => {
      // Check for epoch mismatch if epoch provided
      if (dataEpoch) {
        const hasMismatch = await checkEpochMismatch(userData.id, dataEpoch);

        if (hasMismatch) {
          // Get pending changes count for user decision
          const { total } = await getPendingChangesCount();

          // Set pending state - user must confirm before proceeding
          setEpochMismatchPending({
            pendingChangesCount: total,
            serverEpoch: dataEpoch,
            userData,
            rawPassword,
            passwordHash,
          });

          // Don't complete login yet - wait for user confirmation
          return;
        }

        // No mismatch - update epoch
        await updateSyncMeta(userData.id, dataEpoch);
      }

      if (userData.isEncrypted && rawPassword && userData.encryptionSalt) {
        try {
          const key = await deriveKey(rawPassword, userData.encryptionSalt);
          setEncryptionKey(key);
          setGlobalCryptoKey(key, true);
        } catch (e) {
          console.error("Failed to derive encryption key:", e);
        }
      }

      setUser(userData);
      setIsOfflineMode(false);

      try {
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData));
      } catch {}

      // Save credentials for offline use if hash provided
      if (passwordHash) {
        try {
          await saveCredentialsLocally(userData, passwordHash);
        } catch (e) {}
      }
    },
    [],
  );

  /**
   * Confirm epoch reset - clears local data and completes login
   */
  const confirmEpochReset = useCallback(async () => {
    if (!epochMismatchPending) return;

    const { userData, rawPassword, passwordHash, serverEpoch } =
      epochMismatchPending;

    // Clear all local entity data
    await clearAllLocalData();

    // Update epoch to new value
    await updateSyncMeta(userData.id, serverEpoch);

    // Clear pending state
    setEpochMismatchPending(null);

    // Complete login
    if (userData.isEncrypted && rawPassword && userData.encryptionSalt) {
      try {
        const key = await deriveKey(rawPassword, userData.encryptionSalt);
        setEncryptionKey(key);
        setGlobalCryptoKey(key, true);
      } catch (e) {
        console.error("Failed to derive encryption key on reset:", e);
      }
    }
    setUser(userData);
    setIsOfflineMode(false);

    try {
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData));
    } catch {}

    if (passwordHash) {
      try {
        await saveCredentialsLocally(userData, passwordHash);
      } catch (e) {}
    }
  }, [epochMismatchPending]);

  /**
   * Cancel epoch reset - abort login
   */
  const cancelEpochReset = useCallback(() => {
    setEpochMismatchPending(null);
  }, []);

  /**
   * Unified login that works online and offline
   */
  const loginWithCredentials = useCallback(
    async (
      email: string,
      password: string,
      options: LoginWithServerOptions,
    ): Promise<boolean> => {
      const online = isOnline();

      if (online) {
        // ===== ONLINE LOGIN =====
        try {
          const formData = new FormData();
          formData.set("email", email);
          formData.set("password", password);

          const result = await options.serverLoginFn(formData);

          if (result.success && result.data?.user) {
            const userData = result.data.user;
            const passwordHash = result.data.passwordHash;
            const dataEpoch = result.data.dataEpoch;

            await login(userData, password, passwordHash, dataEpoch);
            options.onSuccess?.(userData, false);
            return true;
          }

          const errorMsg =
            result.error?.message ||
            result.error?.email ||
            result.error?.password ||
            t("errors.loginFailed");
          options.onError?.(errorMsg, false);
          return false;
        } catch (error: any) {
          // Network error - try offline
          if (
            error?.message?.includes("fetch") ||
            error?.code === "ERR_NETWORK"
          ) {
            return attemptOfflineLogin(email, password, options);
          }

          options.onError?.(error?.message || t("errors.loginFailed"), false);
          return false;
        }
      } else {
        // ===== OFFLINE LOGIN =====
        return attemptOfflineLogin(email, password, options);
      }

      return false;
    },
    [login],
  );

  const attemptOfflineLogin = async (
    email: string,
    password: string,
    options: LoginWithServerOptions,
  ): Promise<boolean> => {
    // We need to get translations here too, but this function is in a hook, so we can't easily use async getClientTranslations inside it
    // if it wasn't already passed down.
    // However, this is inside AuthContext, so we can use useTranslations?
    // Wait, AuthContext is a client component ('use client').
    // But getClientTranslations is for async actions.
    // Inside a component we should use useTranslations from next-intl.

    // Let's check imports in AuthContext.
    // It doesn't import useTranslations. Let's add it.

    const hasCredentials = await hasLocalCredentials(email);

    if (!hasCredentials) {
      options.onError?.(tOffline("offlineLoginIncorrect"), true);
      return false;
    }

    const result = await validateOfflineLogin(email, password);

    if (result.success && result.user) {
      const userData = result.user as User;

      if (userData.isEncrypted && password && userData.encryptionSalt) {
        try {
          const key = await deriveKey(password, userData.encryptionSalt);
          setEncryptionKey(key);
          setGlobalCryptoKey(key, true);
        } catch (e) {
          console.error("Failed to derive offline encryption key:", e);
        }
      }

      setUser(userData);
      setIsOfflineMode(true);

      try {
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData));
      } catch {}

      options.onSuccess?.(userData, true);
      return true;
    }

    options.onError?.(
      result.error || tOffline("offlineInvalidCredentials"),
      true,
    );
    return false;
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const refreshSession = async () => {
    await checkAuth();
  };

  const canLoginOfflineCheck = async (email: string): Promise<boolean> => {
    return hasLocalCredentials(email);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isOfflineMode,
    epochMismatchPending,
    encryptionKey,
    login,
    loginWithCredentials,
    logout,
    updateUser,
    refreshSession,
    canLoginOffline: canLoginOfflineCheck,
    confirmEpochReset,
    cancelEpochReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useTranslations } from "next-intl";
import { localDb } from "@/freelib/dexie/dbSchema";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const LAST_USER_KEY = "last-auth-user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("auth");

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      localStorage.removeItem(LAST_USER_KEY);
    } catch {}

    // Clear local Dexie database for privacy/security
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
      ]);
    } catch (e) {}

    window.location.href = "/";
  }, []);

  const checkAuth = async () => {
    try {
      const raw = localStorage.getItem(LAST_USER_KEY);
      if (raw) {
        const maybeUser = JSON.parse(raw) as User;
        if (maybeUser?.id && maybeUser?.role) {
          setUser(maybeUser);
          return;
        }
      }
      setUser(null);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData));
    } catch {}
  }, []);

  const updateUser = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData));
    } catch {}
  };

  const refreshSession = async () => {
    await checkAuth();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshSession,
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

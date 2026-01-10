
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const LAST_USER_KEY = 'last-auth-user'

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AuthProvider] checkAuth start');
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        // Offline fallback: allow previously logged-in users to use the app offline.
        try {
          const raw = localStorage.getItem(LAST_USER_KEY)
          const parsed = raw ? (JSON.parse(raw) as unknown) : null
          if (parsed && typeof parsed === 'object') {
            const maybeUser = parsed as User
            if (maybeUser?.id && maybeUser?.role) {
              setUser(maybeUser)
              console.log('[AuthProvider] offline fallback user restored')
              return
            }
          }
        } catch {}

        setUser(null);
        console.log('[AuthProvider] checkAuth /api/auth/me not ok', { status: response.status });
        return;
      }

      const data = await response.json().catch(() => null);
      const nextUser = (data as any)?.user ?? null;
      console.log('[AuthProvider] checkAuth got user', { hasUser: !!nextUser });
      setUser(nextUser);

      // Persist for offline usage
      try {
        if (nextUser) {
          localStorage.setItem(LAST_USER_KEY, JSON.stringify(nextUser))
        } else {
          localStorage.removeItem(LAST_USER_KEY)
        }
      } catch {}
    } catch (error) {
      console.error('Auth check failed:', error);

      // Offline fallback when fetch throws.
      try {
        const raw = localStorage.getItem(LAST_USER_KEY)
        const parsed = raw ? (JSON.parse(raw) as unknown) : null
        if (parsed && typeof parsed === 'object') {
          const maybeUser = parsed as User
          if (maybeUser?.id && maybeUser?.role) {
            setUser(maybeUser)
            return
          }
        }
      } catch {}

      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('[AuthProvider] checkAuth end');
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData))
    } catch {}
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      try {
        localStorage.removeItem(LAST_USER_KEY)
      } catch {}
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      try {
        localStorage.removeItem(LAST_USER_KEY)
      } catch {}
      window.location.href = '/';
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
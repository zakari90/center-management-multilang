
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
      console.log('[AuthProvider] checkAuth start (client-side only)');

      // 100% client-side: read from localStorage/Dexie only
      try {
        const raw = localStorage.getItem(LAST_USER_KEY)
        const parsed = raw ? (JSON.parse(raw) as unknown) : null
        if (parsed && typeof parsed === 'object') {
          const maybeUser = parsed as User
          if (maybeUser?.id && maybeUser?.role) {
            setUser(maybeUser)
            console.log('[AuthProvider] user restored from localStorage')
            return
          }
        }
      } catch {}

      setUser(null);
      console.log('[AuthProvider] no stored user');
      return;
    } catch (error) {
      console.error('Auth check failed:', error);
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
    // 100% client-side: no server call
    setUser(null);
    try {
      localStorage.removeItem(LAST_USER_KEY)
    } catch {}
    window.location.href = '/';
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
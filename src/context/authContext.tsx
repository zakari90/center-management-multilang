
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { getSession } from '@/lib/actionsClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

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
      // getSession returns the decrypted session object or null
      const session = await getSession();
      console.log('[AuthProvider] checkAuth got session', { hasSession: !!session, hasUser: !!(session as any)?.user });
      if (session && session.user) {
        setUser(session.user as User);
      } else {
        setUser(null);
      }
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
  };

  const logout = async () => {
    try {
      // ✅ Clear session cookie (server-side)
      // await fetch('/api/auth/logout', { method: 'POST' });
      
      // ✅ Clear client-side session cookie
      Cookies.remove('session', { path: '/' });
      
      // ✅ Note: User data remains in local DB for offline login capability
      // This allows users to login again offline without re-syncing
      
      // ✅ Clear in-memory user state
      setUser(null);
      
      // ✅ Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear cookies and local state
      Cookies.remove('session', { path: '/' });
      setUser(null);
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

"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

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
      // Try online first
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            // Store in Dexie for offline access
            const { setClientUser } = await import('@/lib/clientAuth');
            await setClientUser(data.user);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        console.log('Online auth check failed, trying offline...');
      }
      
      // Fallback to offline: check Dexie
      const { getClientUser } = await import('@/lib/clientAuth');
      const offlineUser = await getClientUser();
      if (offlineUser) {
        setUser(offlineUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    setUser(userData);
    // Store in Dexie for offline access
    try {
      const { setClientUser } = await import('@/lib/clientAuth');
      await setClientUser(userData);
    } catch (error) {
      console.error('Failed to store user in Dexie:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
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
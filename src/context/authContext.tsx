
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { saveCredentialsLocally, validateOfflineLogin, hasLocalCredentials } from '@/lib/offlineAuth';
import { isOnline } from '@/lib/utils/network';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const LAST_USER_KEY = 'last-auth-user'

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
  login: (user: User, passwordHash?: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string, options: LoginWithServerOptions) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
  canLoginOffline: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AuthProvider] checkAuth start (client-side only)');

      // 100% client-side: read from localStorage only
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

  /**
   * Login with user data and optionally save credentials for offline
   */
  const login = useCallback(async (userData: User, passwordHash?: string) => {
    setUser(userData);
    setIsOfflineMode(false);
    
    try {
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData))
    } catch {}

    // Save credentials for offline use if hash provided
    if (passwordHash) {
      try {
        await saveCredentialsLocally(userData, passwordHash);
        console.log('[AuthProvider] Credentials saved for offline login');
      } catch (e) {
        console.warn('[AuthProvider] Failed to save offline credentials:', e);
      }
    }
  }, []);

  /**
   * Unified login that works online and offline
   */
  const loginWithCredentials = useCallback(async (
    email: string, 
    password: string,
    options: LoginWithServerOptions
  ): Promise<boolean> => {
    const online = isOnline();
    console.log('[AuthProvider] loginWithCredentials', { email, online });

    if (online) {
      // ===== ONLINE LOGIN =====
      try {
        const formData = new FormData();
        formData.set('email', email);
        formData.set('password', password);

        const result = await options.serverLoginFn(formData);

        if (result.success && result.data?.user) {
          const userData = result.data.user;
          const passwordHash = result.data.passwordHash;
          
          await login(userData, passwordHash);
          options.onSuccess?.(userData, false);
          return true;
        }

        const errorMsg = result.error?.message || result.error?.email || result.error?.password || 'Login failed';
        options.onError?.(errorMsg, false);
        return false;

      } catch (error: any) {
        console.error('[AuthProvider] Online login error:', error);
        
        // Network error - try offline
        if (error?.message?.includes('fetch') || error?.code === 'ERR_NETWORK') {
          console.log('[AuthProvider] Network error, trying offline...');
          return attemptOfflineLogin(email, password, options);
        }

        options.onError?.(error?.message || 'Login failed', false);
        return false;
      }
    } else {
      // ===== OFFLINE LOGIN =====
      return attemptOfflineLogin(email, password, options);
    }
  }, [login]);

  const attemptOfflineLogin = async (
    email: string, 
    password: string,
    options: LoginWithServerOptions
  ): Promise<boolean> => {
    const hasCredentials = await hasLocalCredentials(email);
    
    if (!hasCredentials) {
      options.onError?.('First login requires internet connection', true);
      return false;
    }

    const result = await validateOfflineLogin(email, password);

    if (result.success && result.user) {
      const userData = result.user as User;
      setUser(userData);
      setIsOfflineMode(true);
      
      try {
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(userData))
      } catch {}

      options.onSuccess?.(userData, true);
      return true;
    }

    options.onError?.(result.error || 'Invalid credentials', true);
    return false;
  };

  const logout = async () => {
    // Client-side logout - keep local credentials for future offline login
    setUser(null);
    setIsOfflineMode(false);
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

  const canLoginOfflineCheck = async (email: string): Promise<boolean> => {
    return hasLocalCredentials(email);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isOfflineMode,
    login,
    loginWithCredentials,
    logout,
    updateUser,
    refreshSession,
    canLoginOffline: canLoginOfflineCheck,
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
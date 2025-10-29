// src/components/sync-provider.tsx
"use client"

import { useEffect, useState } from 'react';
import { startSyncEngine } from '@/lib/syncEngine';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const t = useTranslations('offline');

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Start sync engine on mount
    const cleanup = startSyncEngine(30000); // Sync every 30 seconds
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      toast.success(t('status-reconnected'));
      
      // Trigger immediate sync when back online
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info(t('status-disconnected'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  // Show sync indicator when syncing
  useEffect(() => {
    if (syncStatus === 'syncing') {
      const timer = setTimeout(() => setSyncStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  return (
    <>
      {children}
      {/* Sync Status Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {t('status-disconnected')}
          </div>
        </div>
      )}
      {isOnline && syncStatus === 'syncing' && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
            {t('status-checking')}
          </div>
        </div>
      )}
    </>
  );
}

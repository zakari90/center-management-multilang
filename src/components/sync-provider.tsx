// src/components/sync-provider.tsx
"use client"

import { useEffect, useState } from 'react';
import { startSyncEngine, getPendingSyncCount } from '@/lib/syncEngine';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingChanges, setPendingChanges] = useState(0);
  const t = useTranslations('offline');

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Start sync engine on mount
    const cleanup = startSyncEngine(30000); // Sync every 30 seconds
    
    // Check for pending changes
    const checkPending = async () => {
      try {
        const count = await getPendingSyncCount();
        setPendingChanges(count);
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };
    checkPending();
    const pendingCheckInterval = setInterval(checkPending, 10000); // Check every 10s
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      toast.success(t('status-reconnected'));
      checkPending(); // Recheck pending changes
      
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
      clearInterval(pendingCheckInterval);
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
      
      {/* Disconnected Status Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 bg-orange-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 border border-orange-400">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="flex flex-col">
              <span className="font-medium">{t('status-disconnected')}</span>
              {pendingChanges > 0 && (
                <span className="text-xs opacity-90">{pendingChanges} pending change{pendingChanges !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Syncing Status Indicator */}
      {isOnline && syncStatus === 'syncing' && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 border border-blue-400">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
            <span className="font-medium">{t('status-checking')}</span>
          </div>
        </div>
      )}

      {/* Synced Status Indicator (brief) */}
      {isOnline && syncStatus === 'idle' && pendingChanges === 0 && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 border border-green-400 opacity-0 animate-pulse duration-100" style={{ animationIterationCount: 1 }}>
          <div className="flex items-center gap-2">
            <span>✓ {t('status-synced') || 'All synced'}</span>
          </div>
        </div>
      )}
    </>
  );
}

// src/components/sync-provider.tsx
"use client"

import { useEffect, useState } from 'react';
import { fullSync } from '@/lib/dexie/syncWorker';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { 
  userActions, 
  centerActions, 
  teacherActions, 
  studentActions, 
  subjectActions, 
  receiptActions, 
  scheduleActions 
} from '@/lib/dexie/dexieActions';

/**
 * Get total count of pending changes across all entities
 */
async function getPendingSyncCount(): Promise<number> {
  try {
    const [
      users,
      centers,
      teachers,
      students,
      subjects,
      receipts,
      schedules,
    ] = await Promise.all([
      userActions.getSyncTargets(),
      centerActions.getSyncTargets(),
      teacherActions.getSyncTargets(),
      studentActions.getSyncTargets(),
      subjectActions.getSyncTargets(),
      receiptActions.getSyncTargets(),
      scheduleActions.getSyncTargets(),
    ]);

    const waitingCount = 
      users.waiting.length +
      centers.waiting.length +
      teachers.waiting.length +
      students.waiting.length +
      subjects.waiting.length +
      receipts.waiting.length +
      schedules.waiting.length;

    const pendingCount = 
      users.pending.length +
      centers.pending.length +
      teachers.pending.length +
      students.pending.length +
      subjects.pending.length +
      receipts.pending.length +
      schedules.pending.length;

    return waitingCount + pendingCount;
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    return 0;
  }
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingChanges, setPendingChanges] = useState(0);
  const t = useTranslations('offline');

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

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
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      toast.success(t('status-reconnected'));
      
      // Trigger sync when back online
      try {
        await fullSync();
        await checkPending();
      } catch (error) {
        console.error('Sync failed:', error);
        setSyncStatus('error');
      } finally {
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info(t('status-disconnected'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
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

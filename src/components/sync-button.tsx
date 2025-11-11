'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { fullSync } from '@/lib/dexie/syncWorker'
import { 
  userActions, 
  centerActions, 
  teacherActions, 
  studentActions, 
  subjectActions, 
  receiptActions, 
  scheduleActions 
} from '@/lib/dexie/dexieActions'

interface SyncButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

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

export function SyncButton({ 
  className,
  variant = 'outline',
  size = 'default'
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  // const [isChecking, setIsChecking] = useState(false)
  const [isOnline, setIsOnline] = useState(true) // Start with true to match SSR

  // Update online status after hydration
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline', {
        icon: <AlertCircle className="h-4 w-4" />
      })
      return
    }

    setIsSyncing(true)
    try {
      // Check pending count before sync
      const pendingBefore = await getPendingSyncCount()
      
      if (pendingBefore === 0) {
        toast.info('No pending changes to sync', {
          icon: <Info className="h-4 w-4" />
        })
        setIsSyncing(false)
        return
      }

      toast.info(`Syncing ${pendingBefore} pending changes...`, {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />
      })

      await fullSync()
      
      const pendingAfter = await getPendingSyncCount()
      const synced = pendingBefore - pendingAfter
      
      if (synced > 0) {
        toast.success(`Successfully synced ${synced} items!`, {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      } else {
        toast.success('All items are synced', {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error(
        `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          icon: <AlertCircle className="h-4 w-4" />
        }
      )
    } finally {
      setIsSyncing(false)
    }
  }

  // const checkSyncQueue = async () => {
  //   setIsChecking(true)
  //   try {
  //     const pendingCount = await getPendingSyncCount()

  //     if (pendingCount === 0) {
  //       toast.success('All synced! No pending changes', {
  //         icon: <CheckCircle2 className="h-4 w-4" />
  //       })
  //     } else {
  //       toast.info(`${pendingCount} pending changes`, {
  //         icon: <Info className="h-4 w-4" />
  //       })
  //     }
  //   } catch (error) {
  //     toast.error('Failed to check sync queue')
  //     console.error('Check sync queue error:', error)
  //   } finally {
  //     setIsChecking(false)
  //   }
  // }

  // const viewSyncQueue = async () => {
  //   try {
  //     const [
  //       users,
  //       centers,
  //       teachers,
  //       students,
  //       subjects,
  //       receipts,
  //       schedules,
  //     ] = await Promise.all([
  //       userActions.getSyncTargets(),
  //       centerActions.getSyncTargets(),
  //       teacherActions.getSyncTargets(),
  //       studentActions.getSyncTargets(),
  //       subjectActions.getSyncTargets(),
  //       receiptActions.getSyncTargets(),
  //       scheduleActions.getSyncTargets(),
  //     ]);

  //     const allPending = {
  //       users: { waiting: users.waiting.length, pending: users.pending.length },
  //       centers: { waiting: centers.waiting.length, pending: centers.pending.length },
  //       teachers: { waiting: teachers.waiting.length, pending: teachers.pending.length },
  //       students: { waiting: students.waiting.length, pending: students.pending.length },
  //       subjects: { waiting: subjects.waiting.length, pending: subjects.pending.length },
  //       receipts: { waiting: receipts.waiting.length, pending: receipts.pending.length },
  //       schedules: { waiting: schedules.waiting.length, pending: schedules.pending.length },
  //     };

  //     console.log('📋 Sync Queue:', allPending);
      
  //     const total = Object.values(allPending).reduce((acc, val) => acc + val.waiting + val.pending, 0);
  //     if (total === 0) {
  //       toast.info('Sync queue is empty', {
  //         icon: <Info className="h-4 w-4" />
  //       })
  //     } else {
  //       toast.info(`Found ${total} operations in sync queue. Check console for details.`, {
  //         icon: <Info className="h-4 w-4" />
  //       })
  //     }
  //   } catch (error) {
  //     toast.error('Failed to view sync queue')
  //     console.error('View sync queue error:', error)
  //   }
  // }

  // const isLoading = isSyncing || isChecking
  const isLoading = isSyncing 

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isLoading || !isOnline}
        onClick={handleSync}
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {size !== 'icon' && (
          <span className="ml-2">
            {isSyncing ? 'Syncing...' : 'Sync'}
          </span>
        )}
      </Button>
    </div>
  )
}

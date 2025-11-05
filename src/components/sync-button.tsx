'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { syncWithServer, getPendingSyncCount } from '@/lib/syncEngine'
import { localDb } from '@/lib/dexie'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface SyncButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SyncButton({ 
  className,
  variant = 'outline',
  size = 'default'
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

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

      const result = await syncWithServer()
      
      if (result.success) {
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
      } else {
        toast.error(`Sync failed: ${result.reason || 'Unknown error'}`, {
          icon: <AlertCircle className="h-4 w-4" />
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

  const checkSyncQueue = async () => {
    setIsChecking(true)
    try {
      const pendingCount = await getPendingSyncCount()
      const failedOps = await localDb.syncQueue
        .where('status')
        .equals('failed')
        .count()

      const syncingOps = await localDb.syncQueue
        .where('status')
        .equals('syncing')
        .count()

      if (pendingCount === 0 && failedOps === 0) {
        toast.success('All synced! No pending changes', {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      } else {
        let message = `${pendingCount} pending`
        if (failedOps > 0) message += `, ${failedOps} failed`
        if (syncingOps > 0) message += `, ${syncingOps} syncing`
        
        toast.info(message, {
          icon: <Info className="h-4 w-4" />
        })
      }
    } catch (error) {
      toast.error('Failed to check sync queue')
      console.error('Check sync queue error:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const viewSyncQueue = async () => {
    try {
      const allOps = await localDb.syncQueue.toArray()
      console.log('📋 Sync Queue:', allOps)
      
      if (allOps.length === 0) {
        toast.info('Sync queue is empty', {
          icon: <Info className="h-4 w-4" />
        })
      } else {
        toast.info(`Found ${allOps.length} operations in sync queue. Check console for details.`, {
          icon: <Info className="h-4 w-4" />
        })
      }
    } catch (error) {
      toast.error('Failed to view sync queue')
      console.error('View sync queue error:', error)
    }
  }

  const isLoading = isSyncing || isChecking
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {size !== 'icon' && (
            <span className="ml-2">
              {isSyncing ? 'Syncing...' : 'Sync'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleSync}
          disabled={!isOnline || isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={checkSyncQueue}
          disabled={isLoading}
        >
          <Info className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Check Status</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={viewSyncQueue}
          disabled={isLoading}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          <span>View Sync Queue (Console)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { SyncManager } from '@/lib/syncManager'
import { ServerAction } from '@/lib/serverAction'
import { DexieActions } from '@/lib/dexieActions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SyncButtonProps {
  apiEndpoint: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SyncButton({ 
  apiEndpoint, 
  className,
  variant = 'outline',
  size = 'default'
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleSync = async () => {
    if (!ServerAction.isOnline()) {
      toast.error('Cannot sync while offline')
      return
    }

    setIsSyncing(true)
    try {
      const result = await SyncManager.syncAll(apiEndpoint)
      
      if (result.success) {
        const message = result.synced > 0 || result.deleted > 0
          ? `Synced ${result.synced} items, deleted ${result.deleted} items`
          : 'All items are already synced'
        toast.success(message, {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      } else {
        const errorMessage = result.errors.length > 0
          ? result.errors.join(', ')
          : 'Sync failed'
        toast.error(errorMessage, {
          icon: <AlertCircle className="h-4 w-4" />
        })
      }
    } catch (error) {
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

  const handleImport = async () => {
    if (!ServerAction.isOnline()) {
      toast.error('Cannot import while offline')
      return
    }

    setIsImporting(true)
    try {
      const response = await ServerAction.fetchItems(apiEndpoint)
      
      if (response.success && response.data) {
        let imported = 0
        let updated = 0
        
        for (const item of response.data) {
          // Check if item already exists locally
          const existing = await DexieActions.getItem(item.id || '')
          
          if (existing) {
            // Update existing item
            await DexieActions.updateItem(item.id!, {
              ...item,
              syncStatus: 'synced' as const, // Mark as synced
              updatedAt: new Date()
            })
            updated++
          } else {
            // Create new item as synced
            await DexieActions.createItemSynced(item, item.id)
            imported++
          }
        }
        
        const message = imported > 0 || updated > 0
          ? `Imported ${imported} new items, updated ${updated} items`
          : 'No new items to import'
        toast.success(message, {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      } else {
        toast.error(
          response.error || 'Failed to import data',
          {
            icon: <AlertCircle className="h-4 w-4" />
          }
        )
      }
    } catch (error) {
      toast.error(
        `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          icon: <AlertCircle className="h-4 w-4" />
        }
      )
    } finally {
      setIsImporting(false)
    }
  }

  const getSyncStatus = async () => {
    try {
      const status = await SyncManager.getSyncStatus()
      const hasPending = status.waiting > 0 || status.pendingDelete > 0
      
      if (hasPending) {
        toast.info(
          `Sync status: ${status.waiting} waiting, ${status.pendingDelete} pending delete`,
          {
            icon: <RefreshCw className="h-4 w-4" />
          }
        )
      } else {
        toast.success(
          `All synced: ${status.synced} items`,
          {
            icon: <CheckCircle2 className="h-4 w-4" />
          }
        )
      }
    } catch {
      toast.error('Failed to get sync status')
    }
  }

  const isLoading = isSyncing || isImporting
  const isOnline = ServerAction.isOnline()

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
          <span>Sync to Server</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleImport}
          disabled={!isOnline || isLoading}
        >
          <Download className={`mr-2 h-4 w-4 ${isImporting ? 'animate-spin' : ''}`} />
          <span>Import from Server</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={getSyncStatus}
          disabled={isLoading}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          <span>Check Sync Status</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Bug, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { syncWithServer, getPendingSyncCount } from '@/lib/syncEngine'
import { localDb } from '@/lib/dexie'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// ScrollArea component not needed - will use regular div with overflow

interface SyncOperation {
  id?: number
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string
  entityId?: string
  data: any
  timestamp: Date
  attempts: number
  status: 'pending' | 'syncing' | 'failed'
  error?: string
}

export function DebugSyncButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])
  const [syncResult, setSyncResult] = useState<any>(null)
  const [stats, setStats] = useState<{
    pending: number
    failed: number
    syncing: number
    total: number
  } | null>(null)

  const loadSyncQueue = async () => {
    setIsLoading(true)
    try {
      const allOps = await localDb.syncQueue.toArray()
      setSyncQueue(allOps)

      const pending = await localDb.syncQueue.where('status').equals('pending').count()
      const failed = await localDb.syncQueue.where('status').equals('failed').count()
      const syncing = await localDb.syncQueue.where('status').equals('syncing').count()

      setStats({
        pending,
        failed,
        syncing,
        total: allOps.length
      })
    } catch (error) {
      toast.error('Failed to load sync queue')
      console.error('Load sync queue error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline', {
        icon: <AlertCircle className="h-4 w-4" />
      })
      return
    }

    setIsSyncing(true)
    setSyncResult(null)
    try {
      const pendingBefore = await getPendingSyncCount()
      
      toast.info(`Starting sync of ${pendingBefore} items...`, {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />
      })

      const result = await syncWithServer()
      setSyncResult(result)
      
      // Reload queue after sync
      await loadSyncQueue()

      if (result.success) {
        const pendingAfter = await getPendingSyncCount()
        const synced = pendingBefore - pendingAfter
        
        toast.success(`Synced ${synced} items successfully!`, {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
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

  const clearFailedOperations = async () => {
    try {
      await localDb.syncQueue.where('status').equals('failed').delete()
      toast.success('Cleared failed operations')
      await loadSyncQueue()
    } catch (error) {
      toast.error('Failed to clear operations')
      console.error('Clear failed operations error:', error)
    }
  }

  const retryFailedOperations = async () => {
    try {
      const failedOps = await localDb.syncQueue.where('status').equals('failed').toArray()
      for (const op of failedOps) {
        await localDb.syncQueue.update(op.id!, { 
          status: 'pending',
          attempts: 0,
          error: undefined
        })
      }
      toast.success(`Marked ${failedOps.length} operations for retry`)
      await loadSyncQueue()
    } catch (error) {
      toast.error('Failed to retry operations')
      console.error('Retry failed operations error:', error)
    }
  }

  const viewOperationDetails = (op: SyncOperation) => {
    console.group(`🔍 Operation Details: ${op.entity} ${op.operation}`)
    console.log('ID:', op.id)
    console.log('Entity ID:', op.entityId)
    console.log('Status:', op.status)
    console.log('Attempts:', op.attempts)
    console.log('Timestamp:', op.timestamp)
    console.log('Data:', op.data)
    if (op.error) console.error('Error:', op.error)
    console.groupEnd()
    
    toast.info('Operation details logged to console', {
      icon: <Info className="h-4 w-4" />
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>
      case 'syncing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Syncing</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return '➕'
      case 'UPDATE':
        return '✏️'
      case 'DELETE':
        return '🗑️'
      default:
        return '❓'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) loadSyncQueue()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bug className="h-4 w-4 mr-2" />
          Debug Sync
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Sync Queue Debug Panel
          </DialogTitle>
          <DialogDescription>
            Monitor and control sync operations. View details, retry failed operations, and debug sync issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-yellow-600">Pending</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-red-600">Failed</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-blue-600">Syncing</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-2xl font-bold text-blue-600">{stats.syncing}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleSync} 
              disabled={isSyncing || !navigator.onLine}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button 
              onClick={loadSyncQueue} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </Button>
            <Button 
              onClick={retryFailedOperations} 
              disabled={!stats?.failed}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed ({stats?.failed || 0})
            </Button>
            <Button 
              onClick={clearFailedOperations} 
              disabled={!stats?.failed}
              variant="destructive"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Failed
            </Button>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <Card className={syncResult.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {syncResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  Last Sync Result
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xs space-y-1">
                  <div>Success: {syncResult.success ? 'Yes' : 'No'}</div>
                  {syncResult.reason && <div>Reason: {syncResult.reason}</div>}
                  {syncResult.successCount !== undefined && <div>Synced: {syncResult.successCount}</div>}
                  {syncResult.failCount !== undefined && <div>Failed: {syncResult.failCount}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operations List */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Sync Queue Operations</CardTitle>
              <CardDescription className="text-xs">
                {syncQueue.length === 0 ? 'No operations in queue' : `${syncQueue.length} operations`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="h-[300px] w-full overflow-y-auto">
                <div className="space-y-2 pr-2">
                  {syncQueue.map((op) => (
                    <Card key={op.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getOperationIcon(op.operation)}</span>
                            <span className="font-medium text-sm">{op.entity}</span>
                            <span className="text-xs text-muted-foreground">{op.operation}</span>
                            {getStatusBadge(op.status)}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>ID: {op.entityId || 'N/A'}</div>
                            <div>Attempts: {op.attempts}</div>
                            <div>Time: {new Date(op.timestamp).toLocaleString()}</div>
                            {op.error && (
                              <div className="text-red-600 font-medium mt-1">
                                Error: {op.error}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewOperationDetails(op)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Status */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


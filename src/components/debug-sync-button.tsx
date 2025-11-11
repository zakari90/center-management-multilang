/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Bug, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { syncPendingEntities } from '@/lib/dexie/syncWorker'
import {
  userActions,
  centerActions,
  teacherActions,
  studentActions,
  subjectActions,
  receiptActions,
  scheduleActions,
} from '@/lib/dexie/dexieActions'
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

interface EntityStats {
  entity: string;
  waiting: number;
  pending: number;
  total: number;
}

async function getEntityStats(): Promise<EntityStats[]> {
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

    return [
      { entity: 'users', waiting: users.waiting.length, pending: users.pending.length, total: users.waiting.length + users.pending.length },
      { entity: 'centers', waiting: centers.waiting.length, pending: centers.pending.length, total: centers.waiting.length + centers.pending.length },
      { entity: 'teachers', waiting: teachers.waiting.length, pending: teachers.pending.length, total: teachers.waiting.length + teachers.pending.length },
      { entity: 'students', waiting: students.waiting.length, pending: students.pending.length, total: students.waiting.length + students.pending.length },
      { entity: 'subjects', waiting: subjects.waiting.length, pending: subjects.pending.length, total: subjects.waiting.length + subjects.pending.length },
      { entity: 'receipts', waiting: receipts.waiting.length, pending: receipts.pending.length, total: receipts.waiting.length + receipts.pending.length },
      { entity: 'schedules', waiting: schedules.waiting.length, pending: schedules.pending.length, total: schedules.waiting.length + schedules.pending.length },
    ];
  } catch (error) {
    console.error('Error getting entity stats:', error);
    return [];
  }
}

export function DebugSyncButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [entityStats, setEntityStats] = useState<EntityStats[]>([])
  const [syncResult, setSyncResult] = useState<any>(null)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const stats = await getEntityStats()
      setEntityStats(stats)
    } catch (error) {
      toast.error('Failed to load stats')
      console.error('Load stats error:', error)
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

      await syncPendingEntities()
      
      // Reload stats after sync
      await loadStats()

      const pendingAfter = await getPendingSyncCount()
      const synced = pendingBefore - pendingAfter
      
      setSyncResult({ success: true, synced, pendingBefore, pendingAfter })
      
      if (synced > 0) {
        toast.success(`Synced ${synced} items successfully!`, {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      } else {
        toast.success('All items are synced!', {
          icon: <CheckCircle2 className="h-4 w-4" />
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
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

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  const totalPending = entityStats.reduce((sum, stat) => sum + stat.total, 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) loadStats()
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
            Monitor and control sync operations. View pending items by entity type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Total Pending</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{totalPending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-yellow-600">Waiting</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {entityStats.reduce((sum, stat) => sum + stat.waiting, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm text-red-600">Pending Delete</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold text-red-600">
                  {entityStats.reduce((sum, stat) => sum + stat.pending, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleSync} 
              disabled={isSyncing || !isOnline}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button 
              onClick={loadStats} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
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
                  {syncResult.synced !== undefined && <div>Synced: {syncResult.synced}</div>}
                  {syncResult.pendingBefore !== undefined && <div>Before: {syncResult.pendingBefore}</div>}
                  {syncResult.pendingAfter !== undefined && <div>After: {syncResult.pendingAfter}</div>}
                  {syncResult.error && <div className="text-red-600">Error: {syncResult.error}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entity Stats */}
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Pending Items by Entity</CardTitle>
              <CardDescription className="text-xs">
                Items waiting for sync (status &apos;w&apos;) or pending deletion (status &apos;0&apos;)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {entityStats.map((stat) => (
                  <div key={stat.entity} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{stat.entity}</span>
                      {stat.waiting > 0 && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          {stat.waiting} waiting
                        </Badge>
                      )}
                      {stat.pending > 0 && (
                        <Badge variant="destructive">
                          {stat.pending} pending delete
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {stat.total}
                    </div>
                  </div>
                ))}
                {entityStats.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No pending items
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Online Status */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

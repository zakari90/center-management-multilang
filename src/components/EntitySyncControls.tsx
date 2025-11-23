/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, Download } from 'lucide-react'
import { toast } from 'sonner'
import { isOnline } from '@/lib/utils/network'
import {
  ServerActionUsers,
  ServerActionCenters,
  ServerActionTeachers,
  ServerActionStudents,
  ServerActionSubjects,
  ServerActionReceipts,
  ServerActionSchedules,
} from '@/lib/dexie/serverActions'

type EntityType =
  | 'users'
  | 'centers'
  | 'teachers'
  | 'students'
  | 'subjects'
  | 'receipts'
  | 'schedules'

interface EntitySyncControlsProps {
  entity: EntityType
}

const entityLabels: Record<EntityType, string> = {
  users: 'Users',
  centers: 'Centers',
  teachers: 'Teachers',
  students: 'Students',
  subjects: 'Subjects',
  receipts: 'Receipts',
  schedules: 'Schedules',
}

export function EntitySyncControls({ entity }: EntitySyncControlsProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleSync = async () => {
    if (!isOnline()) {
      toast.error(`Cannot sync ${entityLabels[entity]}: You are offline`)
      return
    }

    setIsSyncing(true)
    try {
      let result: any
      switch (entity) {
        case 'users':
          result = await ServerActionUsers.Sync()
          break
        case 'centers':
          result = await ServerActionCenters.Sync()
          break
        case 'teachers':
          result = await ServerActionTeachers.Sync()
          break
        case 'students':
          result = await ServerActionStudents.Sync()
          break
        case 'subjects':
          result = await ServerActionSubjects.Sync()
          break
        case 'receipts':
          result = await ServerActionReceipts.Sync()
          break
        case 'schedules':
          result = await ServerActionSchedules.Sync()
          break
      }
      
      // Show detailed result
      if (result?.message) {
        // const successCount = result.successCount || 0
        const failCount = result.failCount || 0
        
        if (failCount === 0) {
          toast(result.message || `${entityLabels[entity]} synced successfully`)
        } else {
          toast(result.message || `${entityLabels[entity]} sync completed with ${failCount} error(s)`)
        }
        
        // Log details for debugging
        if (result.results && result.results.length > 0) {
          console.log(`[${entityLabels[entity]} Sync] Results:`, result.results)
          const failed = result.results.filter((r: any) => !r.success)
          if (failed.length > 0) {
            console.error(`[${entityLabels[entity]} Sync] Failed items:`, failed)
          }
        }
      } else {
        toast.success(`${entityLabels[entity]} synced with server`)
      }
    } catch (e: any) {
      console.error(`[${entityLabels[entity]} Sync] Error:`, e)
      toast.error(`Failed to sync ${entityLabels[entity]}: ${e?.message || 'Unknown error'}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleImport = async () => {
    if (!isOnline()) {
      toast.error(`Cannot import ${entityLabels[entity]}: You are offline`)
      return
    }

    setIsImporting(true)
    try {
      let result: any
      switch (entity) {
        case 'users':
          result = await ServerActionUsers.ImportFromServer()
          break
        case 'centers':
          result = await ServerActionCenters.ImportFromServer()
          break
        case 'teachers':
          result = await ServerActionTeachers.ImportFromServer()
          break
        case 'students':
          result = await ServerActionStudents.ImportFromServer()
          break
        case 'subjects':
          result = await ServerActionSubjects.ImportFromServer()
          break
        case 'receipts':
          result = await ServerActionReceipts.ImportFromServer()
          break
        case 'schedules':
          result = await ServerActionSchedules.ImportFromServer()
          break
      }
      
      if (result?.message) {
        toast.success(result.message || `${entityLabels[entity]} imported from server`)
      } else {
        toast.success(`${entityLabels[entity]} imported from server`)
      }
    } catch (e: any) {
      console.error(`[${entityLabels[entity]} Import] Error:`, e)
      toast.error(`Failed to import ${entityLabels[entity]}: ${e?.message || 'Unknown error'}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Sync {entityLabels[entity]}
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleImport}
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Import {entityLabels[entity]}
          </>
        )}
      </Button>
    </div>
  )
}



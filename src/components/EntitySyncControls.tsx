/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, Download } from 'lucide-react'
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
    setIsSyncing(true)
    try {
      switch (entity) {
        case 'users':
          await ServerActionUsers.Sync()
          break
        case 'centers':
          await ServerActionCenters.Sync()
          break
        case 'teachers':
          await ServerActionTeachers.Sync()
          break
        case 'students':
          await ServerActionStudents.Sync()
          break
        case 'subjects':
          await ServerActionSubjects.Sync()
          break
        case 'receipts':
          await ServerActionReceipts.Sync()
          break
        case 'schedules':
          await ServerActionSchedules.Sync()
          break
      }
      // Simple feedback; you can replace with toast
      window.alert(`${entityLabels[entity]} synced with server.`)
    } catch (e: any) {
      window.alert(`Failed to sync ${entityLabels[entity]}: ${e?.message || 'Unknown error'}`)
    } finally {
      setIsSyncing(false)
      // Caller page should re-read Dexie data in its own logic (e.g. refetch)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      switch (entity) {
        case 'users':
          await ServerActionUsers.ImportFromServer()
          break
        case 'centers':
          await ServerActionCenters.ImportFromServer()
          break
        case 'teachers':
          await ServerActionTeachers.ImportFromServer()
          break
        case 'students':
          await ServerActionStudents.ImportFromServer()
          break
        case 'subjects':
          await ServerActionSubjects.ImportFromServer()
          break
        case 'receipts':
          await ServerActionReceipts.ImportFromServer()
          break
        case 'schedules':
          await ServerActionSchedules.ImportFromServer()
          break
      }
      window.alert(`${entityLabels[entity]} imported from server.`)
    } catch (e: any) {
      window.alert(`Failed to import ${entityLabels[entity]}: ${e?.message || 'Unknown error'}`)
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



'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { teacherActions, studentActions } from '@/lib/dexie/dexieActions'
import ServerActionTeachers from '@/lib/dexie/teacherServerAction'
import ServerActionStudents from '@/lib/dexie/studentServerAction'
import { isOnline } from '@/lib/utils/network'
import { UserData } from './types'
import { OrphanedRecord } from '@/utils/orphanedRecords'

interface OrphanedRecordsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orphanedTeachers: OrphanedRecord[]
  orphanedStudents: OrphanedRecord[]
  availableManagers: UserData[]
  onRecordsFixed: () => void
}

export function OrphanedRecordsDialog({
  open,
  onOpenChange,
  orphanedTeachers,
  orphanedStudents,
  availableManagers,
  onRecordsFixed
}: OrphanedRecordsDialogProps) {
  const t = useTranslations('AllUsersTable')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const totalOrphaned = orphanedTeachers.length + orphanedStudents.length

  const handleReassign = async () => {
    if (!selectedManagerId) {
      toast.error(t('selectManagerFirst'))
      return
    }

    setIsProcessing(true)
    try {
      const now = Date.now()

      // Update orphaned teachers
      for (const teacher of orphanedTeachers) {
        await teacherActions.update(teacher.id, {
          managerId: selectedManagerId,
          updatedAt: now
        })

        // Sync to server if online
        if (isOnline()) {
          try {
            const updatedTeacher = await teacherActions.getLocal(teacher.id)
            if (updatedTeacher) {
              await ServerActionTeachers.SaveToServer(updatedTeacher)
              await teacherActions.markSynced(teacher.id)
            }
          } catch (syncError) {
            console.error(`Failed to sync teacher ${teacher.id}:`, syncError)
          }
        }
      }

      // Update orphaned students
      for (const student of orphanedStudents) {
        await studentActions.update(student.id, {
          managerId: selectedManagerId,
          updatedAt: now
        })

        // Sync to server if online
        if (isOnline()) {
          try {
            const updatedStudent = await studentActions.getLocal(student.id)
            if (updatedStudent) {
              await ServerActionStudents.SaveToServer(updatedStudent)
              await studentActions.markSynced(student.id)
            }
          } catch (syncError) {
            console.error(`Failed to sync student ${student.id}:`, syncError)
          }
        }
      }

      toast.success(t('orphanedRecordsFixed', { count: totalOrphaned }))
      onOpenChange(false)
      onRecordsFixed()
    } catch (error) {
      console.error('Failed to reassign orphaned records:', error)
      toast.error(t('reassignFailed'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {t('orphanedRecordsFound')}
          </DialogTitle>
          <DialogDescription>
            {t('orphanedRecordsDescription', { count: totalOrphaned })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Orphaned Teachers */}
          {orphanedTeachers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                {t('teachers')}
                <Badge variant="secondary">{orphanedTeachers.length}</Badge>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orphanedTeachers.map(teacher => (
                  <Card key={teacher.id} className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{teacher.name}</p>
                      {teacher.email && (
                        <p className="text-xs text-muted-foreground">{teacher.email}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Orphaned Students */}
          {orphanedStudents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                {t('students')}
                <Badge variant="secondary">{orphanedStudents.length}</Badge>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orphanedStudents.map(student => (
                  <Card key={student.id} className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{student.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {student.grade && <span>{student.grade}</span>}
                        {student.email && <span>{student.email}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Manager Selection */}
          <div className="pt-4 border-t">
            <Label htmlFor="manager-select" className="text-sm font-medium mb-2 block">
              {t('reassignTo')}
            </Label>
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger id="manager-select">
                <SelectValue placeholder={t('selectManager')} />
              </SelectTrigger>
              <SelectContent>
                {availableManagers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('reassignWarning', { count: totalOrphaned })}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!selectedManagerId || isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('reassignAll')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

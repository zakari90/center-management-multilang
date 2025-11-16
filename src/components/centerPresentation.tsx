/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { EntitySyncControls } from "@/components/EntitySyncControls"
import { ItemInputList } from "@/components/itemInputList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { centerActions, subjectActions } from "@/lib/dexie/dexieActions"
import { ServerActionCenters } from "@/lib/dexie/serverActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useLiveQuery } from "dexie-react-hooks"
import { BookOpen, Building2, CalendarDays, Loader2, Pencil, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { EditDialog } from "./editDialog"
import { EditSubjectCard } from "./editSubjectCard"
import { SubjectForm } from "./subjectForm"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { useLocalizedConstants } from "./useLocalizedConstants"


export default function CenterPresentation({ centerId }: any) {
  const t = useTranslations('CenterPresentation')
  const { availableSubjects, availableGrades } = useLocalizedConstants()

  // ✅ Use useLiveQuery for real-time updates from IndexedDB
  const center = useLiveQuery(
    () => centerActions.getLocal(centerId),
    [centerId]
  )

  // ✅ Use useLiveQuery for subjects with filtering (excludes deleted items)
  const subjects = useLiveQuery(
    async () => {
      if (!centerId) return []
      const allSubjects = await subjectActions.getAll()
      return allSubjects.filter(s => 
        s.centerId === centerId && s.status !== '0'
      )
    },
    [centerId]
  )

  const [tempClassrooms, setTempClassrooms] = useState<string[]>([])
  const [tempWorkingDays, setTempWorkingDays] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCenterDebugSyncing, setIsCenterDebugSyncing] = useState(false)

  // ✅ Sync temp states when center loads
  useEffect(() => {
    if (center) {
      setTempClassrooms(center.classrooms)
      setTempWorkingDays(center.workingDays)
    }
  }, [center])

  // ✅ Show loading state
  if (!center) {
    return (
      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <Card className="shadow-lg border border-border bg-background">
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground">{t('loading') || 'Loading...'}</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const handleAddSubject = () => {
    setIsAddDialogOpen(true)
  }

  // ✅ Add subject - simplified, useLiveQuery handles state updates
  const addSubject = async (subjectName: string, grade: string, price: number, duration?: number) => {
    try {
      const now = Date.now()
      const subjectId = generateObjectId()
      
      const newSubject: any = {
        id: subjectId,
        name: subjectName,
        grade,
        price,
        duration: duration ?? undefined,
        centerId: centerId,
        status: 'w',
        createdAt: now,
        updatedAt: now,
      }

      await subjectActions.putLocal(newSubject)
      
      // ✅ No need to update local state - useLiveQuery auto-updates
      toast.success(t('subjectAdded') || "Subject added successfully")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding subject:", error)
      toast.error(t('subjectAddFailed') || "Failed to add subject")
    }
  }

  // ✅ Update subject - simplified
  const handleUpdateSubject = async (subjectId: string, updatedData: Partial<any>) => {
    try {
      const existingSubject = await subjectActions.getLocal(subjectId)
      
      if (!existingSubject) {
        toast.error(t('subjectNotFound') || "Subject not found")
        return
      }

      const updatedSubject: any = {
        ...existingSubject,
        name: updatedData.name ?? existingSubject.name,
        grade: updatedData.grade ?? existingSubject.grade,
        price: updatedData.price ?? existingSubject.price,
        duration: updatedData.duration !== undefined 
          ? (updatedData.duration === null ? undefined : updatedData.duration)
          : existingSubject.duration,
        status: 'w', // Mark as waiting for sync
        updatedAt: Date.now(),
      }

      await subjectActions.putLocal(updatedSubject)
      
      // ✅ No need to update local state - useLiveQuery auto-updates
      toast.success(t('subjectUpdated') || "Subject updated successfully")
    } catch (error) {
      console.error("Error updating subject:", error)
      toast.error(t('subjectUpdateFailed') || "Failed to update subject")
    }
  }

  // ✅ Delete subject - simplified
  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await subjectActions.markForDelete(subjectId)
      
      // ✅ No need to update local state - useLiveQuery auto-updates
      toast.success(t('subjectDeleted') || "Subject deleted successfully")
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error(t('subjectDeleteFailed') || "Failed to delete subject")
    }
  }

  // ✅ Update classrooms - simplified
  const handleSaveClassrooms = async () => {
    try {
      const updatedCenter: any = {
        ...center,
        classrooms: tempClassrooms,
        status: 'w',
        updatedAt: Date.now(),
      }
      
      await centerActions.putLocal(updatedCenter)
      
      // ✅ No need to update local state - useLiveQuery auto-updates
      toast.success(t('classroomsUpdated') || "Classrooms updated successfully")
    } catch (error) {
      console.error("Error updating classrooms:", error)
      toast.error(t('classroomsUpdateFailed') || "Failed to update classrooms")
    }
  }

  // ✅ Update working days - simplified
  const handleSaveWorkingDays = async () => {
    try {
      const updatedCenter: any = {
        ...center,
        workingDays: tempWorkingDays,
        status: 'w',
        updatedAt: Date.now(),
      }
      
      await centerActions.putLocal(updatedCenter)
      
      // ✅ No need to update local state - useLiveQuery auto-updates
      toast.success(t('workingDaysUpdated') || "Working days updated successfully")
    } catch (error) {
      console.error("Error updating working days:", error)
      toast.error(t('workingDaysUpdateFailed') || "Failed to update working days")
    }
  }

  // 🔍 Debug sync button for center entity
  const handleDebugCenterSync = async () => {
    setIsCenterDebugSyncing(true)
    try {
      const result = await ServerActionCenters.Sync()
      console.log("[CenterSync Debug] Result:", result)
      toast.success(result?.message || "Center sync completed. See console for details.")
    } catch (error) {
      console.error("[CenterSync Debug] Error:", error)
      toast.error("Center sync failed. Check console for details.")
    } finally {
      setIsCenterDebugSyncing(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Card className="shadow-lg border border-border bg-background">
        <CardHeader className="text-center space-y-2 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary truncate">
            {center.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t('centerOverview')}</p>
          {center.address && (
            <p className="text-sm text-muted-foreground whitespace-pre-line break-words px-2 sm:px-0">
              {center.address}
            </p>
          )}
          {center.phone && (
            <p className="text-sm text-muted-foreground px-2 sm:px-0">
              {t('phone')} {center.phone}
            </p>
          )}
          
          {/* Center sync controls */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            <EntitySyncControls entity="centers" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDebugCenterSync}
              disabled={isCenterDebugSyncing}
            >
              {isCenterDebugSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('debugSyncing') || 'Debug syncing...'}
                </>
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  {t('debugSync') || 'Debug Center Sync'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <Separator className="my-2" />

        <CardContent className="space-y-6 px-4 sm:px-6">
          {/* Subjects Section */}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <BookOpen className="h-4 w-4" />
                <span>{t('subjectsOffered')}</span>
              </div>
              <Button onClick={handleAddSubject} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('addSubject')}
              </Button>
            </div>
            
            {/* ✅ Single subject list rendering */}
            <div className="space-y-3">
              {subjects && subjects.length > 0 ? (
                subjects.map((subject) => (
                  <EditSubjectCard
                    key={subject.id}
                    subject={{
                      id: subject.id,
                      name: subject.name,
                      grade: subject.grade,
                      price: subject.price,
                      duration: subject.duration ?? null,
                      onUpdate: new Date(subject.updatedAt).toISOString(),
                      centerId: subject.centerId,
                    }}
                    onUpdate={handleUpdateSubject}
                    onDelete={handleDeleteSubject}
                    availableSubjects={availableSubjects}
                    availableGrades={availableGrades}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t('noSubjects') || 'No subjects added'}
                </p>
              )}
            </div>
          </div>

          {/* Classrooms Section */}
          <Section
            title={t('availableClassrooms')}
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            items={center.classrooms}
            onEditButton={
              <EditDialog
                title={t('editClassrooms')}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t('edit')}
                  </Button>
                }
                onSave={handleSaveClassrooms}
              >
                <ItemInputList
                  label={t('classroomsLabel')}
                  placeholder={t('classroomPlaceholder')}
                  items={tempClassrooms}
                  onChange={setTempClassrooms}
                  suggestions={center.classrooms}
                />
              </EditDialog>
            }
            noDataText={t('noData')}
          />

          {/* Working Days Section */}
          <Section
            title={t('workingDays')}
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            items={center.workingDays}
            onEditButton={
              <EditDialog
                title={t('editWorkingDays')}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t('edit')}
                  </Button>
                }
                onSave={handleSaveWorkingDays}
              >
                <ItemInputList
                  label={t('workingDaysLabel')}
                  placeholder={t('dayPlaceholder')}
                  items={tempWorkingDays}
                  onChange={setTempWorkingDays}
                  suggestions={center.workingDays}
                />
              </EditDialog>
            }
            noDataText={t('noData')}
          />
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t('addNewSubject')}</DialogTitle>
            <DialogDescription>{t('addSubjectDescription')}</DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 py-4 px-1">
            <SubjectForm
              onAddSubject={addSubject}
              availableSubjects={availableSubjects}
              availableGrades={availableGrades}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

type SectionProps = {
  title: string
  icon: React.ReactNode
  items: string[]
  onEditButton?: React.ReactNode
  noDataText?: string
}

function Section({ title, icon, items, onEditButton, noDataText = "No data" }: SectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        {onEditButton}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map(item => (
            <Badge key={item} variant="secondary" className="text-sm truncate max-w-xs">
              {item}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic truncate">{noDataText}</p>
        )}
      </div>
    </div>
  )
}

"use client"

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
import axios from "axios"
import { BookOpen, Building2, CalendarDays, Pencil, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { EditDialog } from "./editDialog"
import { EditSubjectCard } from "./editSubjectCard"
import { SubjectForm } from "./subjectForm"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { useLocalizedConstants } from "./useLocalizedConstants"

type Subject = {
  id: string
  name: string
  grade: string
  price: number
  duration: number | null
  createdAt: string
  updatedAt: string
  centerId: string
}

export type Center = {
  id: string
  name: string
  address?: string
  phone?: string
  classrooms: string[]
  workingDays: string[]
  subjects: Subject[]
  createdAt: string
  updatedAt: string
  adminId: string
}

export default function CenterPresentation(center: Center) {
  const t = useTranslations('CenterPresentation')
  const { availableSubjects, availableGrades } = useLocalizedConstants();
  
  const [formData, setFormData] = useState({
    name: center.name,
    address: center.address,
    phone: center.phone,
    classrooms: center.classrooms,
    workingDays: center.workingDays,
    subjects: center.subjects
  })

  const addSubject = (subjectName: string, grade: string, price: number, duration?: number) => {
    // @ts-expect-error id is missing but you might generate it in backend or UI
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: subjectName, grade, price, duration }]
    }))
  }
  
  const [tempClassrooms, setTempClassrooms] = useState(formData.classrooms)
  const [tempWorkingDays, setTempWorkingDays] = useState(formData.workingDays)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const handleAddSubject = () => {
    setIsAddDialogOpen(true)
  }

    // Update existing subject
  const handleUpdateSubject = async (subjectId: string, updatedData: Partial<Subject>) => {
    try {
      const { data } = await axios.patch(`/api/subjects`, {
        subjectId,
        ...updatedData
      })

      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => s.id === subjectId ? data : s)
      }))

      toast("Subject updated successfully")
    } catch (error) {
      console.log(error);
      
      toast("Failed to update subject")
    }
  }

  // Delete subject
  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { deleteSubject } = await import('@/lib/apiClient');
      const { fullSync } = await import('@/lib/dexie/syncWorker');
      
      // Delete using the new deletion logic (handles status 'w' vs '1')
      await deleteSubject(subjectId);
      
      // Update UI immediately
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.id !== subjectId)
      }))

      toast.success("Subject deleted successfully")
      
      // Trigger sync for other pending items
      fullSync().catch(err => console.error('Sync failed:', err));
    } catch (error) {
      console.error('Failed to delete subject:', error);
      toast.error("Failed to delete subject")
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Card className="shadow-lg border border-border bg-background">
        <CardHeader className="text-center space-y-2 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary truncate">
            {formData.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t('centerOverview')}</p>
          {formData.address && (
            <p className="text-sm text-muted-foreground whitespace-pre-line break-words px-2 sm:px-0">{formData.address}</p>
          )}
          {formData.phone && (
            <p className="text-sm text-muted-foreground px-2 sm:px-0">
              {t('phone')} {formData.phone}
            </p>
          )}
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
            <div className="space-y-3">
              {formData.subjects.length > 0 ? (
                formData.subjects.map((subject) => (
                  <EditSubjectCard
                    key={subject.id}
                    subject={subject}
                    onUpdate={handleUpdateSubject}
                    onDelete={handleDeleteSubject}
                    availableSubjects={availableSubjects}
                    availableGrades={availableGrades}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('noSubjects')}</p>
              )}
            </div>
            {/* {formData.subjects.length > 0 ? (
              <div className="space-y-3">
                {formData.subjects.map(subject => (
                  <Card key={subject.id || subject.name} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate">{subject.name}</h4>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{subject.grade}</Badge>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <DollarSign className="h-3 w-3" />
                            {subject.price} {t('currency')}
                          </span>
                          {subject.duration !== null && subject.duration !== undefined && (
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              {subject.duration} {t('duration')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" aria-label={t('edit')}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('noSubjects')}</p>
            )} */}
          </div>

          {/* Classrooms Section */}
          <Section
            title={t('availableClassrooms')}
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            items={formData.classrooms}
            onEditButton={
              <EditDialog
                title={t('editClassrooms')}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t('edit')}
                  </Button>
                }
                onSave={() => setFormData(prev => ({ ...prev, classrooms: tempClassrooms }))}
              >
                <ItemInputList
                  label={t('classroomsLabel')}
                  placeholder={t('classroomPlaceholder')}
                  items={tempClassrooms}
                  onChange={setTempClassrooms}
                  suggestions={formData.classrooms}
                />
              </EditDialog>
            }
            noDataText={t('noData')}
          />

          {/* Working Days Section */}
          <Section
            title={t('workingDays')}
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            items={formData.workingDays}
            onEditButton={
              <EditDialog
                title={t('editWorkingDays')}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t('edit')}
                  </Button>
                }
                onSave={() => setFormData(prev => ({ ...prev, workingDays: tempWorkingDays }))}
              >
                <ItemInputList
                  label={t('workingDaysLabel')}
                  placeholder={t('dayPlaceholder')}
                  items={tempWorkingDays}
                  onChange={setTempWorkingDays}
                  suggestions={formData.workingDays}
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
    
    {/* Scrollable content area */}
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


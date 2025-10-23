/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { BookOpen, Building2, CalendarDays, Clock, DollarSign, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { EditDialog } from "./editDialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { useTranslations } from "next-intl"
import { useLocalizedConstants } from "./useLocalizedConstants"
import { SubjectForm } from "./subjectForm"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@radix-ui/react-alert-dialog"
import { Label } from "recharts"
import { AlertDialogHeader, AlertDialogFooter } from "./ui/alert-dialog"
import { Input } from "./ui/input"
import axios from "axios"
import { toast } from "sonner"

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
      await axios.delete(`/api/subjects`, {
        data: { subjectId }
      })

      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.id !== subjectId)
      }))

      toast("Subject deleted successfully")
    } catch (error) {
      console.log(error );
      
      toast("Failed to delete subject")
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
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onUpdate={handleUpdateSubject}
                    onDelete={handleDeleteSubject}
                    availableSubjects={availableSubjects}
                    availableGrades={availableGrades}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No subjects added</p>
              )}
            </div>
            {formData.subjects.length > 0 ? (
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
            )}
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


function SubjectCard({ 
  subject, 
  onUpdate, 
  onDelete,
  availableSubjects,
  availableGrades
}: { 
  subject: Subject
  onUpdate: (id: string, data: Partial<Subject>) => void
  onDelete: (id: string) => void
  availableSubjects: string[]
  availableGrades: string[]
}) {
  const [tempSubject, setTempSubject] = useState({
    selectedSubject: subject.name,
    selectedGrade: subject.grade,
    price: subject.price.toString(),
    duration: subject.duration?.toString() || ""
  })

  const handleUpdateSubject = () => {
    onUpdate(subject.id, {
      name: tempSubject.selectedSubject,
      grade: tempSubject.selectedGrade,
      price: parseFloat(tempSubject.price),
      duration: tempSubject.duration ? parseInt(tempSubject.duration) : null
    })
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-base">{subject.name}</h4>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{subject.grade}</Badge>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {subject.price} MAD
            </span>
            {subject.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {subject.duration} min
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <EditDialog
            title="Edit Subject"
            trigger={
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            }
            onSave={handleUpdateSubject}
          >
            <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
              <div className="space-y-4">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label>Select Subject *</Label>
                  <ItemInputList
                    label="Subject"
                    placeholder="Type or select a subject"
                    items={tempSubject.selectedSubject ? [tempSubject.selectedSubject] : []}
                    onChange={(items) => {
                      const single = items[0] || ""
                      setTempSubject(prev => ({ ...prev, selectedSubject: single }))
                    }}
                    suggestions={availableSubjects}
      
                  />
                </div>

                {/* Grade Selection */}
                <div className="space-y-2">
                  <Label>Select Grade *</Label>
                  <ItemInputList
                    label="Grade"
                    placeholder="Type or select a grade"
                    items={tempSubject.selectedGrade ? [tempSubject.selectedGrade] : []}
                    onChange={(items) => {
                      const single = items[0] || ""
                      setTempSubject(prev => ({ ...prev, selectedGrade: single }))
                    }}
                    suggestions={availableGrades}
      
                  />
                </div>

                {/* Price and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (MAD) *</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={tempSubject.price}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      id="editDuration"
                      type="number"
                      value={tempSubject.duration}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </EditDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete - {subject.name} - from the center.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(subject.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}
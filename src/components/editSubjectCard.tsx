'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DollarSign, Clock, Pencil, Trash2 } from 'lucide-react'
import { EditDialog } from './editDialog'
import { ItemInputList } from './itemInputList'

interface Subject {
  id: string
  name: string
  grade: string
  price: number
  duration: number | null
}

interface SubjectCardProps {
  subject: Subject
  onUpdate: (id: string, data: Partial<Subject>) => void
  onDelete: (id: string) => void
  availableSubjects: string[]
  availableGrades: string[]
}

export function EditSubjectCard({ 
  subject, 
  onUpdate, 
  onDelete,
  availableSubjects,
  availableGrades
}: SubjectCardProps) {
  const t = useTranslations('subjects')
  
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
            title={t('editSubject')}
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
                  <Label>
                    {t('selectSubject')} {t('requiredField')}
                  </Label>
                  <ItemInputList
                    label={t('labels.subject')}
                    placeholder={t('placeholders.subject')}
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
                  <Label>
                    {t('selectGrade')} {t('requiredField')}
                  </Label>
                  <ItemInputList
                    label={t('labels.grade')}
                    placeholder={t('placeholders.grade')}
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
                    <Label htmlFor="editPrice">
                      {t('price')} {t('requiredField')}
                    </Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={tempSubject.price}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, price: e.target.value }))}
                      placeholder={t('placeholders.price')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDuration">
                      {t('duration')}
                    </Label>
                    <Input
                      id="editDuration"
                      type="number"
                      value={tempSubject.duration}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder={t('placeholders.duration')}
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
                <AlertDialogTitle>{t('deleteSubject')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteConfirmation', { subjectName: subject.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(subject.id)}>
                  {t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}

'use client'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Coins, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
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
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Subject Info */}
        <div className="space-y-2 min-w-0 flex-1">
          <h4 className="font-semibold text-sm sm:text-base truncate">
            {subject.name}
          </h4>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {subject.grade}
            </Badge>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Coins className="h-3 w-3 flex-shrink-0" />
              {subject.price} MAD
            </span>
            {subject.duration && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="h-3 w-3 flex-shrink-0" />
                {subject.duration} h
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <EditDialog
            title={t('editSubject')}
            trigger={
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            }
            onSave={handleUpdateSubject}
          >
            <div className="border rounded-lg p-3 sm:p-4 space-y-4 bg-muted/10 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">
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
                  <Label className="text-xs sm:text-sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label 
                      htmlFor="editPrice"
                      className="text-xs sm:text-sm"
                    >
                      {t('price')} {t('requiredField')}
                    </Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={tempSubject.price}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, price: e.target.value }))}
                      placeholder={t('placeholders.price')}
                      className="text-sm h-10 sm:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="editDuration"
                      className="text-xs sm:text-sm"
                    >
                      {t('duration')}
                    </Label>
                    <Input
                      id="editDuration"
                      type="number"
                      value={tempSubject.duration}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder={t('placeholders.duration')}
                      className="text-sm h-10 sm:h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          </EditDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90vw] max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg sm:text-xl">
                  {t('deleteSubject')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm">
                  {t('deleteConfirmation', { subjectName: subject.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2 flex-col-reverse sm:flex-row">
                <AlertDialogCancel className="w-full sm:w-auto">
                  {t('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(subject.id)}
                  className="w-full sm:w-auto"
                >
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
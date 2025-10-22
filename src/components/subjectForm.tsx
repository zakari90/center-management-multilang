"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { ItemInputList } from "./itemInputList"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export const SubjectForm = ({
  onAddSubject,
  availableSubjects,
  availableGrades
}: {
  onAddSubject: (name: string, grade: string, price: number, duration?: number) => void
  availableSubjects: string[]
  availableGrades: string[]
}) => {
  // Use `subjectForm` namespace to access your keys like "instructions", "selectSubject" etc.
  const t = useTranslations('subjectForm')  

  const [subjectData, setSubjectData] = useState({
    selectedSubject: "",
    selectedGrade: "",
    price: "",
    duration: ""
  })

  const handleAddSubject = () => {
    if (subjectData.selectedSubject && subjectData.selectedGrade && subjectData.price) {
      onAddSubject(
        subjectData.selectedSubject,
        subjectData.selectedGrade,
        parseFloat(subjectData.price),
        subjectData.duration ? parseInt(subjectData.duration) : undefined
      )
      setSubjectData({
        selectedSubject: "",
        selectedGrade: "",
        price: "",
        duration: ""
      })
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
      <div className="text-sm text-muted-foreground mb-4">
        {t('instructions')}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('selectSubject')}</Label>
          <ItemInputList
            label={t('selectSubject')}
            placeholder={t('selectSubjectPlaceholder')}
            items={subjectData.selectedSubject ? [subjectData.selectedSubject] : []}
            onChange={(items) => {
              const single = items[0] || ""
              setSubjectData(prev => ({ ...prev, selectedSubject: single }))
            }}
            suggestions={availableSubjects}
          />
          {subjectData.selectedSubject && (
            <div className="text-xs text-muted-foreground">
              {t('selected', { value: subjectData.selectedSubject })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('selectGrade')}</Label>
          <ItemInputList
            label={t('selectGrade')}
            placeholder={t('selectGradePlaceholder')}
            items={subjectData.selectedGrade ? [subjectData.selectedGrade] : []}
            onChange={(items) => {
              const single = items[0] || ""
              setSubjectData(prev => ({ ...prev, selectedGrade: single }))
            }}
            suggestions={availableGrades}
          />
          {subjectData.selectedGrade && (
            <div className="text-xs text-muted-foreground">
              {t('selected', { value: subjectData.selectedGrade })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subjectPrice">{t('price')}</Label>
            <Input
              id="subjectPrice"
              type="number"
              step="0.01"
              value={subjectData.price}
              onChange={(e) => setSubjectData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectDuration">{t('duration')}</Label>
            <Input
              id="subjectDuration"
              type="number"
              value={subjectData.duration}
              onChange={(e) => setSubjectData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="60"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddSubject}
          size="sm"
          className="w-full"
          disabled={!subjectData.selectedSubject || !subjectData.selectedGrade || !subjectData.price}
        >
          {t('addButton')}
        </Button>
      </div>
    </div>
  )
}

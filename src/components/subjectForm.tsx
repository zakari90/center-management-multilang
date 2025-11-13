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


export const SubjectFormMultipleChoices = ({ 
  onAddSubject, 
  availableSubjects, 
  availableGrades 
}: { 
  onAddSubject: (name: string, grade: string, price: number, duration?: number) => void
  availableSubjects: string[]
  availableGrades: string[]
}) => {
  const t = useTranslations('SubjectForm')
  
  const [subjectData, setSubjectData] = useState({
    selectedSubjects: [] as string[],
    selectedGrades: [] as string[],
    price: "",
    duration: ""
  })

  const updateSubjects = (newSubjects: string[]) => {
    setSubjectData(prev => ({ ...prev, selectedSubjects: newSubjects }))
  }

  const updateGrades = (newGrades: string[]) => {
    setSubjectData(prev => ({ ...prev, selectedGrades: newGrades }))
  }

  const handleAddSubjects = () => {
    if (subjectData.selectedSubjects.length > 0 && 
        subjectData.selectedGrades.length > 0 && 
        subjectData.price) {
      
      // Create combinations of subjects and grades
      subjectData.selectedSubjects.forEach(subject => {
        subjectData.selectedGrades.forEach(grade => {
          onAddSubject(
            subject,
            grade,
            parseFloat(subjectData.price),
            subjectData.duration ? parseInt(subjectData.duration) : undefined
          )
        })
      })
      
      // Reset form
      setSubjectData({ 
        selectedSubjects: [], 
        selectedGrades: [], 
        price: "", 
        duration: "" 
      })
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
      <div className="text-sm text-muted-foreground mb-4">
        {t('selectMultipleInfo')}
      </div>
      
      {/* NO FORM WRAPPER - just div */}
      <div className="space-y-4">
        {/* Subject Selection */}
        <div className="space-y-2">
          <Label>{t('selectSubjectsRequired')}</Label>
          <ItemInputList
            label={t('selectSubjects')}
            placeholder={t('subjectsPlaceholder')}
            items={subjectData.selectedSubjects}
            onChange={updateSubjects}
            suggestions={availableSubjects}
          />
          {subjectData.selectedSubjects.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {t('selected', { value: subjectData.selectedSubjects.join(', ') })}
            </div>
          )}
        </div>

        {/* Grade Selection */}
        <div className="space-y-2">
          <Label>{t('selectGradesRequired')}</Label>
          <ItemInputList
            label={t('selectGrades')}
            placeholder={t('gradesPlaceholder')}
            items={subjectData.selectedGrades}
            onChange={updateGrades}
            suggestions={availableGrades}
          />
          {subjectData.selectedGrades.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {t('selected', { value: subjectData.selectedGrades.join(', ') })}
            </div>
          )}
        </div>

        {/* Price and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subjectPrice">{t('priceRequired')}</Label>
            <Input
              id="subjectPrice"
              type="number"
              step="0.01"
              value={subjectData.price}
              onChange={(e) => setSubjectData(prev => ({ ...prev, price: e.target.value }))}
              placeholder={t('pricePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectDuration">{t('durationOptional')}</Label>
            <Input
              id="subjectDuration"
              type="number"
              value={subjectData.duration}
              onChange={(e) => setSubjectData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder={t('durationPlaceholder')}
            />
          </div>
        </div>

        {/* Preview */}
        {subjectData.selectedSubjects.length > 0 && subjectData.selectedGrades.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              {t('willCreate')} {subjectData.selectedSubjects.length * subjectData.selectedGrades.length} {t('courses')}:
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              {subjectData.selectedSubjects.slice(0, 3).map(subject => (
                <div key={subject}>
                  {subject}: {subjectData.selectedGrades.slice(0, 3).join(', ')}
                  {subjectData.selectedGrades.length > 3 && ` +${subjectData.selectedGrades.length - 3} more`}
                </div>
              ))}
              {subjectData.selectedSubjects.length > 3 && (
                <div className="italic">+{subjectData.selectedSubjects.length - 3} {t('moreSubjects')}</div>
              )}
            </div>
          </div>
        )}

        <Button 
          type="button" // ✅ Important: type="button" to prevent form submission
          onClick={handleAddSubjects}
          size="sm" 
          className="w-full"
          disabled={!subjectData.selectedSubjects.length || !subjectData.selectedGrades.length || !subjectData.price}
        >
          {t('addSubjectsToCenter')}
        </Button>
      </div>
    </div>
  )
}
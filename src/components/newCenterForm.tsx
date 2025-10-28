"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import axios from "axios"
import { Loader2 } from "lucide-react"

export function NewCenterForm() {
  const t = useTranslations('NewCenterForm')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    classrooms: [] as string[],
    workingDays: [] as string[],
    subjects: [] as Array<{
      name: string
      grade: string
      price: number
      duration: string
    }>
  })

  const [newClassroom, setNewClassroom] = useState('')
  const [newSubject, setNewSubject] = useState({
    name: '',
    grade: '',
    price: '',
    duration: ''
  })

  const daysOfWeek = [
    { key: 'monday', label: t('monday') },
    { key: 'tuesday', label: t('tuesday') },
    { key: 'wednesday', label: t('wednesday') },
    { key: 'thursday', label: t('thursday') },
    { key: 'friday', label: t('friday') },
    { key: 'saturday', label: t('saturday') },
    { key: 'sunday', label: t('sunday') }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error(t('centerNameRequired'))
      return
    }

    setIsLoading(true)
    try {
      await axios.post('/api/center', formData)
      toast.success(t('successMessage'))
      // Reset form
      setFormData({
        name: '',
        address: '',
        phone: '',
        classrooms: [],
        workingDays: [],
        subjects: []
      })
    } catch (error) {
      console.error('Error creating center:', error)
      toast.error(t('errorMessage'))
    } finally {
      setIsLoading(false)
    }
  }

  const addClassroom = () => {
    if (newClassroom.trim() && !formData.classrooms.includes(newClassroom.trim())) {
      setFormData(prev => ({
        ...prev,
        classrooms: [...prev.classrooms, newClassroom.trim()]
      }))
      setNewClassroom('')
    }
  }

  const removeClassroom = (classroom: string) => {
    setFormData(prev => ({
      ...prev,
      classrooms: prev.classrooms.filter(c => c !== classroom)
    }))
  }

  const addSubject = () => {
    if (newSubject.name.trim() && newSubject.grade.trim() && newSubject.price.trim()) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, { ...newSubject, price: parseFloat(newSubject.price) }]
      }))
      setNewSubject({ name: '', grade: '', price: '', duration: '' })
    }
  }

  const removeSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }))
  }

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('basicInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('centerNameRequired')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('centerNamePlaceholder')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('phonePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder={t('addressPlaceholder')}
                rows={3}
              />
            </div>

            {/* Classrooms */}
            <div className="space-y-4">
              <Label>{t('classrooms')}</Label>
              <div className="flex gap-2">
                <Input
                  value={newClassroom}
                  onChange={(e) => setNewClassroom(e.target.value)}
                  placeholder={t('classroomPlaceholder')}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClassroom())}
                />
                <Button type="button" onClick={addClassroom} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.classrooms.map((classroom, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                    <span>{classroom}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeClassroom(classroom)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Working Days */}
            <div className="space-y-4">
              <Label>{t('workingDays')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.key}
                      checked={formData.workingDays.includes(day.key)}
                      onCheckedChange={() => toggleWorkingDay(day.key)}
                    />
                    <Label htmlFor={day.key} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-4">
              <Label>{t('subjectsPricing')}</Label>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Subject name"
                />
                <Input
                  value={newSubject.grade}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="Grade"
                />
                <Input
                  type="number"
                  value={newSubject.price}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, price: e.target.value }))}
                  placeholder={t('price')}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newSubject.duration}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder={t('duration')}
                  />
                  <Button type="button" onClick={addSubject} variant="outline">
                    Add
                  </Button>
                </div>
              </div>
              
              {formData.subjects.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('addedSubjects')}</Label>
                  {formData.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-md">
                      <span>{subject.name} - {subject.grade} - {subject.price} MAD</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('creatingCenter')}
                  </>
                ) : (
                  t('createCenter')
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

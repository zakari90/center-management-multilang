"use client"

import { ItemInputList } from "@/components/itemInputList"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { centerActions, subjectActions } from "@/lib/dexie/_dexieActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { Separator } from "@radix-ui/react-separator"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { SubjectFormMultipleChoices } from "./subjectForm"
import { useLocalizedConstants } from "./useLocalizedConstants"
import { useAuth } from "@/context/authContext"
// ./src/components/login-form.tsx:208:41
// Type error: Property 'email' does not exist on type '{ message: string; }'.
// ✅ Add this helper type for form-only subject data
type SubjectFormData = {
  name: string;
  grade: string;
  price: number;
  duration?: number;
}

export const NewCenterForm = () => {
  const t = useTranslations('NewCenterForm')
  const { daysOfWeek, availableSubjects, availableGrades, availableClassrooms } = useLocalizedConstants();
  const router = useRouter()
  const { user } = useAuth() // ✅ Use AuthContext instead of getSession()
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    workingDays: [] as string[],
    classrooms: [] as string[],
    subjects: [] as SubjectFormData[], // ✅ Use form type, not Dexie Subject type
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [step, setStep] = useState(1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const updateClassrooms = (newClassrooms: string[]) => {
    setFormData(prev => ({ ...prev, classrooms: newClassrooms }))
  }

  const addSubject = (subjectName: string, grade: string, price: number, duration?: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: subjectName, grade, price, duration }]
    }))
  }

  const removeSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    
    const centerId = generateObjectId()
    const now = Date.now()
  
    try {
      // ✅ Use AuthContext user instead of getSession (which can't read httpOnly cookies)
      if (!user) {
        setMessage('Unauthorized: Please log in again')
        setLoading(false)
        return
      }

      // ✅ Step 1: Save center WITHOUT subjects array (normalized storage)
      await centerActions.putLocal({
        id: centerId,
        name: formData.name,
        address: formData.address || "",
        phone: formData.phone || "",
        classrooms: formData.classrooms,
        workingDays: formData.workingDays,
        managers: [], // Initialize empty
        adminId: user.id, // ✅ user comes from AuthContext
        status: 'w',
        createdAt: now,
        updatedAt: now,
      })

      // ✅ Step 2: Create subject entities separately (normalized)
      const subjectEntities = formData.subjects.map(subject => ({
        id: generateObjectId(),
        name: subject.name,
        grade: subject.grade,
        price: subject.price,
        duration: subject.duration,
        centerId: centerId, // Link to parent center
        status: 'w' as const,
        createdAt: now,
        updatedAt: now,
      }))

      // Save all subjects in parallel
      await Promise.all(
        subjectEntities.map(subject => subjectActions.putLocal(subject))
      )

      // ✅ Step 3: Sync with server if online
      // if (isOnline()) {
      //   try {
      //     // ✅ Fix: Send subjectEntities with IDs instead of formData.subjects
      //     const payload = {
      //       id: centerId,
      //       name: formData.name,
      //       address: formData.address || null,
      //       phone: formData.phone || null,
      //       classrooms: formData.classrooms,
      //       workingDays: formData.workingDays,
      //       subjects: subjectEntities.map(subject => ({
      //         id: subject.id,
      //         name: subject.name,
      //         grade: subject.grade,
      //         price: subject.price,
      //         duration: subject.duration || null,
      //         createdAt: subject.createdAt,
      //         updatedAt: subject.updatedAt,
      //       })),
      //       adminId: user.id,
      //       createdAt: now,
      //       updatedAt: now,
      //     }

      //     const response = await axios.post('/api/center', payload, { 
      //       headers: { 
      //         "Content-Type": "application/json",
      //       },
      //     })

      //     if (response.status === 200 || response.status === 201) {
      //       // Mark center as synced
      //       await centerActions.markSynced(centerId)
            
      //       // Mark all subjects as synced
      //       await Promise.all(
      //         subjectEntities.map(subject => subjectActions.markSynced(subject.id))
      //       )
            
      //       setMessage(t('successMessage'))
      //     }
      //   } catch (syncError) {
      //     console.error('Sync error:', syncError)
      //     // ✅ Improved error handling: Show actual API error details
      //     if (axios.isAxiosError(syncError)) {
      //       const errorMessage = syncError.response?.data?.error || syncError.message
      //       console.error('API Error Details:', {
      //         status: syncError.response?.status,
      //         data: syncError.response?.data,
      //         message: errorMessage
      //       })
      //       // Show specific error if available, otherwise show offline message
      //       if (syncError.response?.status === 401) {
      //         setMessage('Unauthorized: Please log in again')
      //       } else if (syncError.response?.status === 400) {
      //         setMessage(`Validation error: ${errorMessage}`)
      //       } else {
      //         setMessage(t('savedOfflineMessage'))
      //       }
      //     } else {
      //       setMessage(t('savedOfflineMessage'))
      //     }
      //   }
      // } else {
      //   setMessage(t('savedOfflineMessage'))
      // }

      // Reset form
      setFormData({
        name: "",
        address: "",
        phone: "",
        subjects: [],
        classrooms: [],
        workingDays: [],
      })
      setStep(1)
      router.refresh()
      
    } catch (error) {
      console.error('Form submission error:', error)
      setMessage(t('errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  // ... rest of your component remains the same
  return (
    <Card className="max-w-2xl mx-auto mt-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                <div className="relative my-4 flex items-center justify-center overflow-hidden">
                  <Separator className="flex-1 h-px bg-border" />
                  <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                    <Label>{t('basicInformation')}</Label>
                  </div>
                  <Separator className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('centerNameRequired')}</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t('centerNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t('addressPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('phonePlaceholder')}
                  />
                </div>
              </div>

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <Label>{t('classrooms')}</Label>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <ItemInputList
                label={t('classrooms')}
                placeholder={t('classroomPlaceholder')}
                items={formData.classrooms}
                onChange={updateClassrooms}
                suggestions={availableClassrooms}
              />

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <Label>{t('workingDays')}</Label>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="border rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={day.key}
                        checked={formData.workingDays.includes(day.label)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            workingDays: checked
                              ? [...prev.workingDays, day.label]
                              : prev.workingDays.filter((d) => d !== day.label),
                          }))
                        }}
                      />
                      <Label htmlFor={day.key} className="font-medium">
                        {day.label}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                type="button" 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!formData.name.trim()}
              >
                {t('nextAddSubjects')}
              </Button>
            </>
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <>
              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <Label>{t('subjectsPricing')}</Label>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>

              <SubjectFormMultipleChoices
                onAddSubject={addSubject} 
                availableSubjects={availableSubjects}
                availableGrades={availableGrades}
              />

              {formData.subjects.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('addedSubjects')} ({formData.subjects.length}):</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {subject.grade}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t('price')}: ${subject.price}
                            {subject.duration && ` • ${t('duration')}: ${subject.duration} ${t('minutes')}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          className="ml-2"
                        >
                          {t('remove')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  {t('back')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? t('creatingCenter') : t('createCenter')}
                </Button>
              </div>
            </>
          )}

          {message && (
            <Alert className={message.includes(t('errorMessage').split('.')[0]) ? "border-destructive" : "border-green-500"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

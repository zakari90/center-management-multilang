/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/teachers/[id]/edit/page.tsx
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import axios from 'axios'
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
interface Subject {
  id: string
  name: string
  grade: string
  price: number
}

interface TeacherSubject {
  id: string
  subjectId: string
  percentage: number | null
  hourlyRate: number | null
  subject: Subject
}

interface DaySchedule {
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface Teacher {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  weeklySchedule: any
  teacherSubjects: TeacherSubject[]
}


export default function EditTeacherPage() {
 const t = useTranslations('EditTeacherPage')
  const DAYS = [
    t('monday'), t('tuesday'), t('wednesday'), t('thursday'),
    t('friday'), t('saturday'), t('sunday')
  ]
   const params = useParams()
  // const id = params?.id as string 
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false
    }))
  )

  const [teacherSubjects, setTeacherSubjects] = useState<{
    subjectId: string
    percentage?: number
    hourlyRate?: number
    compensationType: 'percentage' | 'hourly'
  }[]>([])

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const [teacherRes, subjectsRes] = await Promise.all([
        axios.get(`/api/teachers/${params.id}`),
        axios.get('/api/subjects')
      ])

      const teacherData: Teacher = teacherRes.data
      setTeacher(teacherData)
      setSubjects(subjectsRes.data)

      // Set form data
      setFormData({
        name: teacherData.name,
        email: teacherData.email || '',
        phone: teacherData.phone || '',
        address: teacherData.address || '',
      })

      // Set weekly schedule
      if (teacherData.weeklySchedule && Array.isArray(teacherData.weeklySchedule)) {
        const scheduleMap = new Map(
          teacherData.weeklySchedule.map((s: any) => [s.day, s])
        )
        
        setWeeklySchedule(DAYS.map(day => {
          const existing = scheduleMap.get(day)
          return existing ? {
            day,
            startTime: existing.startTime,
            endTime: existing.endTime,
            isAvailable: true
          } : {
            day,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: false
          }
        }))
      }

      // Set teacher subjects
      setTeacherSubjects(
        teacherData.teacherSubjects.map(ts => ({
          subjectId: ts.subject.id,
          percentage: ts.percentage || undefined,
          hourlyRate: ts.hourlyRate || undefined,
          compensationType: ts.percentage ? 'percentage' : 'hourly'
        }))
      )
    } catch (err) {
      console.error('Failed to fetch data:', err)
    setError(t('errorFetchData'))
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setWeeklySchedule(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addSubject = () => {
    setTeacherSubjects(prev => [
      ...prev,
      { subjectId: '', compensationType: 'percentage', percentage: 0, hourlyRate: 0 }
    ])
  }

  const removeSubject = (index: number) => {
    setTeacherSubjects(prev => prev.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, field: string, value: any) => {
    setTeacherSubjects(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const validSubjects = teacherSubjects.filter(ts => ts.subjectId)
      
      for (const ts of validSubjects) {
        if (ts.compensationType === 'percentage' && (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)) {
          throw new Error('Percentage must be between 1 and 100')
        }
        if (ts.compensationType === 'hourly' && (!ts.hourlyRate || ts.hourlyRate <= 0)) {
          throw new Error('Hourly rate must be greater than 0')
        }
      }

      const activeSchedule = weeklySchedule
        .filter(day => day.isAvailable)
        .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))

      await axios.patch(`/api/teachers/${params.id}`, {
        ...formData,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : null,
        subjects: validSubjects.map(ts => ({
          subjectId: ts.subjectId,
          percentage: ts.compensationType === 'percentage' ? ts.percentage : null,
          hourlyRate: ts.compensationType === 'hourly' ? ts.hourlyRate : null,
        }))
      })

      router.push(`/teachers/${params.id}`)
      router.refresh()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log(err.response?.data?.error || 'Failed to update teacher')
setError(t('errorSomethingWrong'))
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
setError(t('errorSomethingWrong'))      
}
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('teacherNotFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('basicInformation')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('fullName')} {t('required')}</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("namePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("emailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phoneNumber')}</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t("phonePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Subjects & Compensation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{t("subjectsCompensation")}</h3>
                  <p className="text-sm text-muted-foreground">{t("assignSubjectsPayment")}</p>
                </div>
                <Button type="button" onClick={addSubject} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addSubject")}
                </Button>
              </div>

              {teacherSubjects.length === 0 ? (
                <Alert>
                  <AlertDescription>{t("noSubjectsAssigned")}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {teacherSubjects.map((ts, index) => {
                    const selectedSubject = subjects.find(s => s.id === ts.subjectId)
                    return (
                      <Card key={index}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="space-y-2">
                                <Label>{t("subject")}</Label>
                                <Select
                                  value={ts.subjectId}
                                  onValueChange={(value) => updateSubject(index, 'subjectId', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectSubject")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects
                                      .filter(s => !teacherSubjects.some((ts2, i) => i !== index && ts2.subjectId === s.id))
                                      .map(subject => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                          {subject.name} - {subject.grade} (${subject.price})
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>{t("paymentType")}</Label>
                                  <Select
                                    value={ts.compensationType}
                                    onValueChange={(value) => updateSubject(index, 'compensationType', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percentage">{t("percentage")}</SelectItem>
                                      <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {ts.compensationType === 'percentage' ? (
                                  <div className="space-y-2">
                                    <Label>{t("percentageLabel")} *</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="100"
                                      step="0.1"
                                      value={ts.percentage || ''}
                                      onChange={(e) => updateSubject(index, 'percentage', parseFloat(e.target.value))}
                                      placeholder="50"
                                      required
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Label>{t("hourlyRate")} *</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={ts.hourlyRate || ''}
                                      onChange={(e) => updateSubject(index, 'hourlyRate', parseFloat(e.target.value))}
                                      placeholder="25.00"
                                      required
                                    />
                                  </div>
                                )}

                                {selectedSubject && (
                                  <div className="space-y-2">
                                    <Label>{t("estEarnings")}</Label>
                                    <div className="h-10 px-3 py-2 bg-primary/10 border rounded-md flex items-center">
                                      <span className="font-semibold text-primary">
                                        {ts.compensationType === 'percentage' && ts.percentage
                                          ? `MAD${((selectedSubject.price * ts.percentage) / 100).toFixed(2)}`
                                          : ts.hourlyRate
                                          ? `MAD${ts.hourlyRate.toFixed(2)}/hr`
                                          : 'MAD 0.00'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubject(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Weekly Schedule */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t("weeklySchedule")}</h3>
                <p className="text-sm text-muted-foreground">{t("selectDaysHours")}</p>
              </div>

              <div className="space-y-3">
                {weeklySchedule.map((schedule, index) => (
                  <div key={schedule.day} className="flex items-center gap-4 p-4 border rounded-md">
                    <div className="flex items-center space-x-2 min-w-[140px]">
                      <Checkbox
                        id={`day-${schedule.day}`}
                        checked={schedule.isAvailable}
                        onCheckedChange={(checked) => 
                          handleScheduleChange(index, 'isAvailable', checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`day-${schedule.day}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {schedule.day}
                      </Label>
                    </div>

                    {schedule.isAvailable && (
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">From:</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">{t("to")}</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
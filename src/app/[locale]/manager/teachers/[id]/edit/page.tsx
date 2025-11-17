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
// import axios from 'axios' // ✅ Commented out - using local DB
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { 
  teacherActions, 
  teacherSubjectActions, 
  subjectActions 
} from '@/lib/dexie/dexieActions'
import { useAuth } from '@/context/authContext'

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
  const { user } = useAuth() // ✅ Get current user from AuthContext
  const DAYS = [
    t('monday'), t('tuesday'), t('wednesday'), t('thursday'),
    t('friday'), t('saturday'), t('sunday')
  ]
  const params = useParams()
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

  const fetchData = useCallback(async () => {
    setIsFetching(true)
    setError('')
    try {
      if (!user) {
        setError("Unauthorized: Please log in again")
        setIsFetching(false)
        return
      }

      // ✅ Fetch from local DB
      const [allTeachers, allTeacherSubjects, allSubjects] = await Promise.all([
        teacherActions.getAll(),
        teacherSubjectActions.getAll(),
        subjectActions.getAll()
      ])

      // ✅ Find teacher by ID
      const teacherData = allTeachers.find(t => t.id === params.id && t.status !== '0')
      
      if (!teacherData) {
        throw new Error(t('teacherNotFound'))
      }

      // ✅ Get teacher subjects
      const teacherSubjectsData = allTeacherSubjects
        .filter(ts => ts.teacherId === params.id && ts.status !== '0')
        .map(ts => {
          const subject = allSubjects.find(s => s.id === ts.subjectId && s.status !== '0')
          if (!subject) return null
          
          return {
            id: ts.id,
            subjectId: ts.subjectId,
            percentage: ts.percentage ?? null,
            hourlyRate: ts.hourlyRate ?? null,
            subject: {
              id: subject.id,
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
            },
          }
        })
        .filter(ts => ts !== null) as TeacherSubject[]

      // ✅ Get subjects (filter by manager)
      const managerSubjects = allSubjects
        .filter(s => s.managerId === user.id && s.status !== '0')
        .map(s => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          price: s.price,
        }))

      // ✅ Parse weekly schedule
      let weeklyScheduleData: DaySchedule[] = DAYS.map(day => ({
        day,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false
      }))

      if (teacherData.weeklySchedule) {
        try {
          const schedule = typeof teacherData.weeklySchedule === 'string' 
            ? JSON.parse(teacherData.weeklySchedule) 
            : teacherData.weeklySchedule
          
          if (Array.isArray(schedule)) {
            const scheduleMap = new Map(
              schedule.map((s: unknown) => {
                const parsed = typeof s === 'string' ? JSON.parse(s) : s
                return [parsed.day, parsed]
              })
            )
            
            weeklyScheduleData = DAYS.map(day => {
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
            })
          }
        } catch (e) {
          console.error('Error parsing weekly schedule:', e)
        }
      }

      // ✅ Build teacher object matching the interface
      const teacherResult: Teacher = {
        id: teacherData.id,
        name: teacherData.name,
        email: teacherData.email ?? null,
        phone: teacherData.phone ?? null,
        address: teacherData.address ?? null,
        weeklySchedule: weeklyScheduleData,
        teacherSubjects: teacherSubjectsData,
      }

      setTeacher(teacherResult)
      setSubjects(managerSubjects)

      setFormData({
        name: teacherData.name,
        email: teacherData.email || '',
        phone: teacherData.phone || '',
        address: teacherData.address || '',
      })

      setWeeklySchedule(weeklyScheduleData)

      setTeacherSubjects(
        teacherSubjectsData.map(ts => ({
          subjectId: ts.subject.id,
          percentage: ts.percentage || undefined,
          hourlyRate: ts.hourlyRate || undefined,
          compensationType: ts.percentage ? 'percentage' : 'hourly'
        }))
      )

      // ✅ Commented out API calls
      // const [teacherRes, subjectsRes] = await Promise.all([
      //   axios.get(`/api/teachers/${params.id}`),
      //   axios.get('/api/subjects')
      // ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : t('errorFetchData'))
    } finally {
      setIsFetching(false)
    }
  }, [params.id, user, t, DAYS])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      if (!user) {
        throw new Error("Unauthorized: Please log in again")
      }

      const validSubjects = teacherSubjects.filter(ts => ts.subjectId)
      
      for (const ts of validSubjects) {
        if (ts.compensationType === 'percentage' && (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)) {
          throw new Error(t('errorPercentage'))
        }
        if (ts.compensationType === 'hourly' && (!ts.hourlyRate || ts.hourlyRate <= 0)) {
          throw new Error(t('errorHourlyRate'))
        }
      }

      // ✅ Get existing teacher
      const existingTeacher = await teacherActions.getLocal(params.id as string)
      if (!existingTeacher) {
        throw new Error(t('teacherNotFound'))
      }

      // ✅ Update teacher in local DB
      const now = Date.now()
      const activeSchedule = weeklySchedule
        .filter(day => day.isAvailable)
        .map(({ day, startTime, endTime }) => JSON.stringify({ day, startTime, endTime }))

      const updatedTeacher = {
        ...existingTeacher,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : [],
        status: 'w' as const, // Mark for sync
        updatedAt: now,
      }

      await teacherActions.putLocal(updatedTeacher)

      // ✅ Update teacher subjects
      // First, get existing teacher subjects
      const existingTeacherSubjects = await teacherSubjectActions.getAll()
      const currentTeacherSubjects = existingTeacherSubjects.filter(
        ts => ts.teacherId === params.id && ts.status !== '0'
      )

      // Remove teacher subjects that are no longer in the list
      const teacherSubjectsToRemove = currentTeacherSubjects.filter(
        cts => !validSubjects.some(
          vs => vs.subjectId === cts.subjectId
        )
      )
      
      for (const ts of teacherSubjectsToRemove) {
        await teacherSubjectActions.markForDelete(ts.id)
      }

      // Update or add teacher subjects
      for (const vs of validSubjects) {
        const existing = currentTeacherSubjects.find(
          cts => cts.subjectId === vs.subjectId
        )

        if (existing) {
          // Update existing
          await teacherSubjectActions.putLocal({
            ...existing,
            percentage: vs.compensationType === 'percentage' ? vs.percentage ?? null : null,
            hourlyRate: vs.compensationType === 'hourly' ? vs.hourlyRate ?? null : null,
            status: 'w' as const, // Mark for sync
            updatedAt: now,
          })
        } else {
          // Add new
          const { generateObjectId } = await import('@/lib/utils/generateObjectId')
          const teacherSubjectId = generateObjectId()
          await teacherSubjectActions.putLocal({
            id: teacherSubjectId,
            teacherId: params.id as string,
            subjectId: vs.subjectId,
            percentage: vs.compensationType === 'percentage' ? vs.percentage ?? null : null,
            hourlyRate: vs.compensationType === 'hourly' ? vs.hourlyRate ?? null : null,
            managerId: user.id,
            status: 'w' as const, // Mark for sync
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      router.push(`/manager/teachers/${params.id}`)
      router.refresh()

      // ✅ Commented out API call
      // await axios.patch(`/api/teachers/${params.id}`, {
      //   ...formData,
      //   weeklySchedule: activeSchedule.length > 0 ? activeSchedule : [],
      //   subjects: validSubjects.map(ts => ({
      //     subjectId: ts.subjectId,
      //     percentage: ts.compensationType === 'percentage' ? ts.percentage : null,
      //     hourlyRate: ts.compensationType === 'hourly' ? ts.hourlyRate : null,
      //   }))
      // })
    } catch (err) {
      if (err instanceof Error) {
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('teacherNotFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">{t('title')}</CardTitle>
          <CardDescription className="text-sm">{t('subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-4 sm:px-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">{t('basicInformation')}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">
                    {t('fullName')} <span className="text-destructive">{t('required')}</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("namePlaceholder")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">{t('email')}</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("emailPlaceholder")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">{t('phoneNumber')}</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t("phonePlaceholder")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">{t('address')}</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t("addressPlaceholder")}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Subjects & Compensation */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">{t("subjectsCompensation")}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("assignSubjectsPayment")}</p>
                </div>
                <Button 
                  type="button" 
                  onClick={addSubject} 
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addSubject")}
                </Button>
              </div>

              {teacherSubjects.length === 0 ? (
                <Alert>
                  <AlertDescription className="text-sm">{t("noSubjectsAssigned")}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {teacherSubjects.map((ts, index) => {
                    const selectedSubject = subjects.find(s => s.id === ts.subjectId)
                    return (
                      <Card key={index}>
                        <CardContent className="pt-4 sm:pt-6 space-y-4 px-4 sm:px-6">
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="flex-1 w-full space-y-4">
                              {/* Subject Selection */}
                              <div className="space-y-2">
                                <Label className="text-sm">{t("subject")}</Label>
                                <Select
                                  value={ts.subjectId}
                                  onValueChange={(value) => updateSubject(index, 'subjectId', value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t("selectSubject")} />
                                  </SelectTrigger>
                                  <SelectContent 
                                    position="popper"
                                    className="max-h-[200px] sm:max-h-[300px]"
                                  >
                                    {subjects
                                      .filter(s => !teacherSubjects.some((ts2, i) => i !== index && ts2.subjectId === s.id))
                                      .map(subject => (
                                        <SelectItem 
                                          key={subject.id} 
                                          value={subject.id}
                                          className="text-xs sm:text-sm"
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 max-w-[250px] sm:max-w-none">
                                            <span className="truncate font-medium">{subject.name}</span>
                                            <span className="text-muted-foreground text-xs truncate">
                                              {subject.grade} · MAD {subject.price}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Payment Type and Amount */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm">{t("paymentType")}</Label>
                                  <Select
                                    value={ts.compensationType}
                                    onValueChange={(value) => updateSubject(index, 'compensationType', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      <SelectItem value="percentage">{t("percentage")}</SelectItem>
                                      <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {ts.compensationType === 'percentage' ? (
                                  <div className="space-y-2">
                                    <Label className="text-sm">
                                      {t("percentageLabel")} <span className="text-destructive">*</span>
                                    </Label>
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
                                    <Label className="text-sm">
                                      {t("hourlyRateLabel")} <span className="text-destructive">*</span>
                                    </Label>
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
                                    <Label className="text-xs sm:text-sm">{t("estEarnings")}</Label>
                                    <div className="h-10 px-3 py-2 bg-primary/10 border rounded-md flex items-center justify-center">
                                      <span className="font-semibold text-primary text-sm truncate">
                                        {ts.compensationType === 'percentage' && ts.percentage
                                          ? `MAD ${((selectedSubject.price * ts.percentage) / 100).toFixed(2)}`
                                          : ts.hourlyRate
                                          ? `MAD ${ts.hourlyRate.toFixed(2)}/hr`
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
                              className="text-destructive hover:text-destructive flex-shrink-0 mt-0 sm:mt-6"
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
                <h3 className="text-base sm:text-lg font-semibold">{t("weeklySchedule")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("selectDaysHours")}</p>
              </div>

              <div className="space-y-3">
                {weeklySchedule.map((schedule, index) => (
                  <div 
                    key={schedule.day} 
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-md bg-muted/50"
                  >
                    <div className="flex items-center space-x-2 min-w-[120px]">
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
                      <div className="flex flex-wrap items-center gap-3 flex-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {t("from")}:
                          </Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {t("to")}:
                          </Label>
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

          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

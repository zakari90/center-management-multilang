/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { createTeacher } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

// ==================== INTERFACES ====================
interface DaySchedule {
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface Subject {
  id: string
  name: string
  grade: string
  price: number
}

interface TeacherSubject {
  subjectId: string
  percentage?: number
  hourlyRate?: number
  compensationType: "percentage" | "hourly"
}

// ==================== SUB-COMPONENTS ====================

// Basic Information Section
const BasicInfoSection = ({
  formData,
  onChange
}: {
  formData: { name: string; email: string; phone: string; address: string }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const t = useTranslations("CreateTeacherForm")
  const fields = [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: false },
    { name: "phone", type: "text", required: false },
    { name: "address", type: "text", required: false },
  ] as const

  return (
    <div className="border-b pb-6">
      <h2 className="text-xl font-semibold mb-4">{t("basicInfo")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {t(field.name)}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type={field.type}
              id={field.name}
              name={field.name}
              required={field.required}
              value={(formData as any)[field.name]}
              onChange={onChange}
              placeholder={t(field.name)}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Subject Compensation Card
const SubjectCompensationCard = ({
  teacherSubject,
  index,
  subjects,
  assignedSubjects,
  onUpdate,
  onRemove,
}: {
  teacherSubject: TeacherSubject
  index: number
  subjects: Subject[]
  assignedSubjects: TeacherSubject[]
  onUpdate: (index: number, field: keyof TeacherSubject, value: any) => void
  onRemove: (index: number) => void
}) => {
  const t = useTranslations("CreateTeacherForm")

  const availableSubjects = subjects.filter(
    (s) => !assignedSubjects.some((ts, i) => i !== index && ts.subjectId === s.id)
  )

  const selectedSubject = subjects.find((s) => s.id === teacherSubject.subjectId)

  const calculateEstimatedEarnings = () => {
    if (!selectedSubject) return "MAD 0.00"

    if (teacherSubject.compensationType === "percentage" && teacherSubject.percentage) {
      const earnings = (selectedSubject.price * teacherSubject.percentage) / 100
      return `MAD ${earnings.toFixed(2)}`
    }

    if (teacherSubject.compensationType === "hourly" && teacherSubject.hourlyRate) {
      return `MAD ${teacherSubject.hourlyRate.toFixed(2)}/hr`
    }

    return "MAD 0.00"
  }

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6 space-y-4">
        {/* Subject Selection */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1 w-full space-y-2">
            <Label htmlFor={`subject-${index}`}>
              {t("subject")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={teacherSubject.subjectId}
              onValueChange={(value) => onUpdate(index, "subjectId", value)}
            >
              <SelectTrigger id={`subject-${index}`} className="w-full">
                <SelectValue placeholder={t("subject")} />
              </SelectTrigger>
              <SelectContent 
                className="max-h-[200px] sm:max-h-[300px] overflow-y-auto"
                position="popper"
                sideOffset={5}
              >
                {availableSubjects.map((subject) => (
                  <SelectItem 
                    key={subject.id} 
                    value={subject.id}
                    className="text-xs sm:text-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 max-w-[250px] sm:max-w-none">
                      <span className="truncate font-medium">{subject.name}</span>
                      <span className="text-muted-foreground truncate">
                        {subject.grade} <span className="hidden sm:inline">·</span> MAD {subject.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="mt-0 sm:mt-7 text-destructive hover:text-destructive flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Compensation Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Payment Type */}
          <div className="space-y-2">
            <Label htmlFor={`payment-type-${index}`}>{t("paymentType")}</Label>
            <Select
              value={teacherSubject.compensationType}
              onValueChange={(value) => onUpdate(index, "compensationType", value)}
            >
              <SelectTrigger id={`payment-type-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={5}
                align="start"
              >
                <SelectItem value="percentage">{t("percentage")}</SelectItem>
                <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Percentage or Hourly Rate */}
          {teacherSubject.compensationType === "percentage" ? (
            <div className="space-y-2">
              <Label htmlFor={`percentage-${index}`}>
                {t("percentage")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`percentage-${index}`}
                type="number"
                min={1}
                max={100}
                step={0.1}
                value={teacherSubject.percentage || ""}
                onChange={(e) => onUpdate(index, "percentage", parseFloat(e.target.value) || 0)}
                placeholder="50"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={`hourly-rate-${index}`}>
                {t("hourlyRate")} (MAD) <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`hourly-rate-${index}`}
                type="number"
                min={0}
                step={0.01}
                value={teacherSubject.hourlyRate || ""}
                onChange={(e) => onUpdate(index, "hourlyRate", parseFloat(e.target.value) || 0)}
                placeholder="25.00"
              />
            </div>
          )}

          {/* Estimated Earnings */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">{t("estimatedEarnings")}</Label>
            <div className="h-10 flex items-center justify-center bg-primary/5 rounded-md border px-3">
              <p className="text-sm sm:text-base font-semibold text-center truncate">
                {calculateEstimatedEarnings()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly Schedule Section
const WeeklyScheduleSection = ({
  weeklySchedule,
  onChange
}: {
  weeklySchedule: DaySchedule[]
  onChange: (index: number, field: keyof DaySchedule, value: string | boolean) => void
}) => {
  const t = useTranslations("CreateTeacherForm")

  return (
    <div className="border-b pb-6">
      <h2 className="text-xl font-semibold mb-4">{t("weeklySchedule")}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t("selectAvailable")}</p>

      <div className="space-y-3">
        {weeklySchedule.map((schedule, index) => (
          <div
            key={schedule.day}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-md"
          >
            {/* Day Checkbox */}
            <div className="flex items-center min-w-[120px]">
              <Checkbox
                id={`day-${schedule.day}`}
                checked={schedule.isAvailable}
                onCheckedChange={(checked) => onChange(index, "isAvailable", checked as boolean)}
              />
              <Label
                htmlFor={`day-${schedule.day}`}
                className="ml-3 cursor-pointer font-medium"
              >
                {schedule.day}
              </Label>
            </div>

            {/* Time Inputs */}
            {schedule.isAvailable && (
              <div className="flex flex-wrap gap-3 flex-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">{t("from")}</Label>
                  <Input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => onChange(index, "startTime", e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">{t("to")}</Label>
                  <Input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => onChange(index, "endTime", e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================
export default function CreateTeacherForm() {
  const router = useRouter()
  const t = useTranslations("CreateTeacherForm")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const DAYS = [
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday"),
    t("sunday")
  ]

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: false,
    }))
  )

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get("/api/subjects")
        if (response) setSubjects(response.data)
      } catch (err) {
        console.error("Failed to fetch subjects:", err)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addSubject = () => {
    setTeacherSubjects((prev) => [
      ...prev,
      { subjectId: "", compensationType: "percentage", percentage: 0, hourlyRate: 0 },
    ])
  }

  const removeSubject = (index: number) => {
    setTeacherSubjects((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, field: keyof TeacherSubject, value: any) => {
    setTeacherSubjects((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError("")

  try {
    const validSubjects = teacherSubjects.filter((ts) => ts.subjectId)

    for (const ts of validSubjects) {
      if (ts.compensationType === "percentage" && (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)) {
        throw new Error("Percentage must be between 1 and 100")
      }
      if (ts.compensationType === "hourly" && (!ts.hourlyRate || ts.hourlyRate <= 0)) {
        throw new Error("Hourly rate must be greater than 0")
      }
    }

  const activeSchedule = weeklySchedule
  .filter(day => day.isAvailable)
  .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }));

    const payload = {
      ...formData,
            weeklySchedule: activeSchedule.length > 0 ? activeSchedule : [],
      subjects: validSubjects.map((ts) => ({
        subjectId: ts.subjectId,
        percentage: ts.compensationType === "percentage" ? ts.percentage : null,
        hourlyRate: ts.compensationType === "hourly" ? ts.hourlyRate : null,
      })),
    }

    // Use offline-capable API client
    await createTeacher(payload)
    
    // Show success message
    if (isOffline) {
      // toast will be shown by apiClient
    }
    
    await router.push("/manager/teachers")
    router.refresh()
  } catch (err) {
    if (axios.isAxiosError(err)) setError(err.response?.data?.error || t("genericError"))
    else if (err instanceof Error) setError(err.message)
    else setError(t("genericError"))
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <BasicInfoSection formData={formData} onChange={handleInputChange} />

            {/* Subjects & Compensation */}
            <div className="border-b pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{t("subjectsCompensation")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("assignSubjects")}</p>
                </div>
                <Button
                  type="button"
                  onClick={addSubject}
                  disabled={loadingSubjects}
                  className="w-full sm:w-auto"
                >
                  {t("addSubject")}
                </Button>
              </div>

              {loadingSubjects ? (
                <p className="text-muted-foreground text-center py-8">{t("loadingSubjects")}</p>
              ) : subjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 bg-muted/50 rounded-md">
                  {t("noSubjects")}
                </p>
              ) : teacherSubjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 bg-muted/50 rounded-md">
                  {t("noSubjectsAssigned")}
                </p>
              ) : (
                <div className="space-y-4">
                  {teacherSubjects.map((ts, index) => (
                    <SubjectCompensationCard
                      key={index}
                      teacherSubject={ts}
                      index={index}
                      subjects={subjects}
                      assignedSubjects={teacherSubjects}
                      onUpdate={updateSubject}
                      onRemove={removeSubject}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Schedule */}
            <WeeklyScheduleSection
              weeklySchedule={weeklySchedule}
              onChange={handleScheduleChange}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
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
                {isLoading ? t("creating") : t("createTeacher")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

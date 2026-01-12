/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { teacherActions, teacherSubjectActions, subjectActions } from "@/lib/dexie/dexieActions"
import ServerActionTeachers from "@/lib/dexie/teacherServerAction"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useAuth } from "@/context/authContext"
import { isOnline } from "@/lib/utils/network"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface AddTeacherDialogProps {
  onTeacherAdded?: () => void
}

// ==================== SUB-COMPONENTS ====================

// Subject Compensation Card (simplified for dialog)
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

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-2">
            <Select
              value={teacherSubject.subjectId}
              onValueChange={(value) => onUpdate(index, "subjectId", value)}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder={t("subject")} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id} className="text-sm">
                    <span className="truncate">{subject.name} ({subject.grade}) - MAD {subject.price}</span>
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
            className="h-9 w-9 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={teacherSubject.compensationType}
            onValueChange={(value) => onUpdate(index, "compensationType", value)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={5}>
              <SelectItem value="percentage">{t("percentage")}</SelectItem>
              <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
            </SelectContent>
          </Select>

          {teacherSubject.compensationType === "percentage" ? (
            <Input
              type="number"
              min={1}
              max={100}
              step={0.1}
              value={teacherSubject.percentage || ""}
              onChange={(e) => onUpdate(index, "percentage", parseFloat(e.target.value) || 0)}
              placeholder="50%"
              className="h-9 text-sm"
            />
          ) : (
            <Input
              type="number"
              min={0}
              step={0.01}
              value={teacherSubject.hourlyRate || ""}
              onChange={(e) => onUpdate(index, "hourlyRate", parseFloat(e.target.value) || 0)}
              placeholder="MAD/hr"
              className="h-9 text-sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== MAIN COMPONENT ====================
export default function AddTeacherDialog({ onTeacherAdded }: AddTeacherDialogProps) {
  const t = useTranslations("CreateTeacherForm")
  const tTable = useTranslations("TeachersTable")
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: "", email: "", phone: "", address: "" })
      setWeeklySchedule(DAYS.map((day) => ({
        day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: false,
      })))
      setTeacherSubjects([])
      setError("")
    }
  }, [open])

  useEffect(() => {
    if (open) {
      const fetchSubjects = async () => {
        try {
          const allSubjects = await subjectActions.getAll()
          const activeSubjects = allSubjects
            .filter(s => s.status !== '0')
            .map(s => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              price: s.price,
            }))
          setSubjects(activeSubjects)
        } catch (err) {
          console.error("Failed to fetch subjects:", err)
        } finally {
          setLoadingSubjects(false)
        }
      }
      fetchSubjects()
    }
  }, [open])

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

    if (!user) {
      setError("Unauthorized: Please log in again")
      setIsLoading(false)
      return
    }

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

      // Check if email already exists in local DB
      if (formData.email) {
        const existingTeacher = await teacherActions.getLocalByEmail?.(formData.email)
        if (existingTeacher) {
          setError("Email already in use")
          setIsLoading(false)
          return
        }
      }

      // Prepare weekly schedule
      const activeSchedule = weeklySchedule
        .filter((day) => day.isAvailable)
        .map(({ day, startTime, endTime }) => 
          JSON.stringify({ day, startTime, endTime })
        )

      // Create teacher in local DB
      const now = Date.now()
      const teacherId = generateObjectId()
      const newTeacher = {
        id: teacherId,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : undefined,
        managerId: user.id,
        status: 'w' as const,
        createdAt: now,
        updatedAt: now,
      }

      await teacherActions.putLocal(newTeacher)

      // Create teacher-subject associations in local DB
      if (validSubjects.length > 0) {
        const teacherSubjectEntities = validSubjects.map((ts) => ({
          id: generateObjectId(),
          teacherId: teacherId,
          subjectId: ts.subjectId,
          percentage: ts.compensationType === "percentage" ? ts.percentage : undefined,
          hourlyRate: ts.compensationType === "hourly" ? ts.hourlyRate : undefined,
          assignedAt: now,
          status: 'w' as const,
          createdAt: now,
          updatedAt: now,
        }))

        await teacherSubjectActions.bulkPutLocal(teacherSubjectEntities)
      }

      // Immediate sync to server if online
      if (isOnline()) {
        try {
          const result = await ServerActionTeachers.SaveToServer(newTeacher as any)
          if (result) {
            await teacherActions.markSynced(teacherId)
            const teacherSubjectsToMark = await teacherSubjectActions.getAll()
            const idsToMark = teacherSubjectsToMark
              .filter(ts => ts.teacherId === teacherId)
              .map(ts => ts.id)
            if (idsToMark.length > 0) {
              await teacherSubjectActions.bulkMarkSynced(idsToMark)
            }
          }
        } catch (syncError) {
          console.error("Teacher immediate sync failed, will retry later:", syncError)
        }
      }

      // Close dialog and notify parent
      setOpen(false)
      onTeacherAdded?.()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError(t("genericError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {tTable("addTeacher")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle") || tTable("subtitle")}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("basicInfo")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">
                  {t("name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("name")}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">{t("email")}</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("email")}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">{t("phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t("phone")}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm">{t("address")}</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t("address")}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Subjects & Compensation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">{t("subjectsCompensation")}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubject}
                disabled={loadingSubjects || subjects.length === 0}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("addSubject")}
              </Button>
            </div>

            {loadingSubjects ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                {t("noSubjects")}
              </p>
            ) : teacherSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                {t("noSubjectsAssigned")}
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
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

          {/* Weekly Schedule (Compact) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("weeklySchedule")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weeklySchedule.map((schedule, index) => (
                <div
                  key={schedule.day}
                  className={`flex items-center gap-2 p-2 rounded-md border ${
                    schedule.isAvailable ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <Checkbox
                    id={`day-${schedule.day}`}
                    checked={schedule.isAvailable}
                    onCheckedChange={(checked) => handleScheduleChange(index, "isAvailable", checked as boolean)}
                  />
                  <Label
                    htmlFor={`day-${schedule.day}`}
                    className="text-xs cursor-pointer truncate"
                  >
                    {schedule.day}
                  </Label>
                </div>
              ))}
            </div>
            
            {/* Time inputs for selected days */}
            {weeklySchedule.some(s => s.isAvailable) && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("from")}</Label>
                  <Input
                    type="time"
                    value={weeklySchedule.find(s => s.isAvailable)?.startTime || "09:00"}
                    onChange={(e) => {
                      weeklySchedule.forEach((s, i) => {
                        if (s.isAvailable) {
                          handleScheduleChange(i, "startTime", e.target.value)
                        }
                      })
                    }}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("to")}</Label>
                  <Input
                    type="time"
                    value={weeklySchedule.find(s => s.isAvailable)?.endTime || "17:00"}
                    onChange={(e) => {
                      weeklySchedule.forEach((s, i) => {
                        if (s.isAvailable) {
                          handleScheduleChange(i, "endTime", e.target.value)
                        }
                      })
                    }}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("createTeacher")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

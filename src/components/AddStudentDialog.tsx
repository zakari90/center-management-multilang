/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { studentActions, studentSubjectActions, subjectActions, teacherSubjectActions, teacherActions } from "@/lib/dexie/dexieActions"
import ServerActionStudents from "@/lib/dexie/studentServerAction"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useAuth } from "@/context/authContext"
import { isOnline } from "@/lib/utils/network"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Loader2, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ==================== INTERFACES ====================
interface Teacher {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface TeacherSubject {
  id: string
  teacherId: string
  percentage: number | null
  hourlyRate: number | null
  teacher: Teacher
}

interface Subject {
  id: string
  name: string
  grade: string
  price: number
  duration: number | null
  teacherSubjects: TeacherSubject[]
}

interface EnrolledSubject {
  subjectId: string
  teacherId: string
  subjectName: string
  teacherName: string
  grade: string
  price: number
}

interface AddStudentDialogProps {
  onStudentAdded?: () => void
}

// ==================== MAIN COMPONENT ====================
export default function AddStudentDialog({ onStudentAdded }: AddStudentDialogProps) {
  const t = useTranslations("CreateStudentForm")
  const tTable = useTranslations("StudentsTable")
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    grade: "",
  })

  // Enrollment flow state
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        grade: "",
      })
      setSelectedGrade("")
      setSelectedSubject(null)
      setSelectedTeacher("")
      setEnrolledSubjects([])
      setError("")
    }
  }, [open])

  // Fetch subjects when dialog opens
  useEffect(() => {
    if (open) {
      const fetchSubjects = async () => {
        try {
          const [allSubjects, allTeacherSubjects, allTeachers] = await Promise.all([
            subjectActions.getAll(),
            teacherSubjectActions.getAll(),
            teacherActions.getAll()
          ])

          const activeSubjects = allSubjects.filter(s => s.status !== '0')
          const activeTeacherSubjects = allTeacherSubjects.filter(ts => ts.status !== '0')
          const activeTeachers = allTeachers.filter(t => t.status !== '0')

          const subjectsWithTeachers: Subject[] = activeSubjects.map(subject => {
            const teacherSubjectsForSubject = activeTeacherSubjects
              .filter(ts => ts.subjectId === subject.id)
              .map(ts => {
                const teacher = activeTeachers.find(t => t.id === ts.teacherId)
                return {
                  id: ts.id,
                  teacherId: ts.teacherId,
                  percentage: ts.percentage ?? null,
                  hourlyRate: ts.hourlyRate ?? null,
                  teacher: teacher ? {
                    id: teacher.id,
                    name: teacher.name,
                    email: teacher.email ?? null,
                    phone: teacher.phone ?? null,
                  } : null,
                }
              })
              .filter(ts => ts.teacher !== null) as TeacherSubject[]

            return {
              id: subject.id,
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
              duration: subject.duration ?? null,
              teacherSubjects: teacherSubjectsForSubject,
            }
          })

          setSubjects(subjectsWithTeachers)
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

  const availableGrades = [...new Set(subjects.map((s) => s.grade))].sort()
  const subjectsForGrade = selectedGrade ? subjects.filter((s) => s.grade === selectedGrade) : []
  const teachersForSubject = selectedSubject?.teacherSubjects?.filter((ts) => ts.teacher) || []

  const handleAddEnrollment = () => {
    if (!selectedSubject || !selectedTeacher) {
      setError(t("errorsselectSubjectTeacher"))
      return
    }

    const alreadyEnrolled = enrolledSubjects.some(
      (es) => es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher
    )
    if (alreadyEnrolled) {
      setError(t("errorsalreadyEnrolled"))
      return
    }

    const teacher = teachersForSubject.find((ts) => ts.teacherId === selectedTeacher)?.teacher
    if (!teacher) return

    setEnrolledSubjects((prev) => [
      ...prev,
      {
        subjectId: selectedSubject.id,
        teacherId: selectedTeacher,
        subjectName: selectedSubject.name,
        teacherName: teacher.name,
        grade: selectedSubject.grade,
        price: selectedSubject.price,
      },
    ])

    setSelectedGrade("")
    setSelectedSubject(null)
    setSelectedTeacher("")
    setError("")
  }

  const handleRemoveEnrollment = (subjectId: string, teacherId: string) => {
    setEnrolledSubjects((prev) => prev.filter((es) => !(es.subjectId === subjectId && es.teacherId === teacherId)))
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
      if (!formData.name) {
        throw new Error(t("errorsrequiredName"))
      }
      if (enrolledSubjects.length === 0) {
        throw new Error(t("errorsnoSubjects"))
      }

      // Check if email already exists
      if (formData.email) {
        const existingStudent = await studentActions.getLocalByEmail?.(formData.email)
        if (existingStudent) {
          setError("Email already in use")
          setIsLoading(false)
          return
        }
      }

      // Create student in local DB
      const now = Date.now()
      const studentId = generateObjectId()
      const newStudent = {
        id: studentId,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        parentName: formData.parentName || undefined,
        parentPhone: formData.parentPhone || undefined,
        parentEmail: formData.parentEmail || undefined,
        grade: formData.grade || enrolledSubjects[0]?.grade || undefined,
        managerId: user.id,
        status: 'w' as const,
        createdAt: now,
        updatedAt: now,
      }

      await studentActions.putLocal(newStudent)

      // Create student-subject-teacher associations
      const studentSubjectEntities = enrolledSubjects.map((es) => ({
        id: generateObjectId(),
        studentId: studentId,
        subjectId: es.subjectId,
        teacherId: es.teacherId,
        managerId: user.id,
        enrolledAt: now,
        status: 'w' as const,
        createdAt: now,
        updatedAt: now,
      }))

      await studentSubjectActions.bulkPutLocal(studentSubjectEntities)

      // Immediate sync to server if online
      if (isOnline()) {
        try {
          const result = await ServerActionStudents.SaveToServer(newStudent as any)
          if (result) {
            await studentActions.markSynced(studentId)
            await studentSubjectActions.bulkMarkSynced(studentSubjectEntities.map(e => e.id))
          }
        } catch (syncError) {
          console.error("Student immediate sync failed, will retry later:", syncError)
        }
      }

      // Close dialog and notify parent
      setOpen(false)
      onStudentAdded?.()
    } catch (err: any) {
      setError(err.message || t("errorsgeneric"))
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = enrolledSubjects.reduce((total, es) => total + es.price, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {tTable("addStudent")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{tTable("subtitle")}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("studentInfotitle")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">
                  {t("studentInfofullName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("studentInfofullNamePlaceholder")}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">{t("studentInfophone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t("studentInfophonePlaceholder")}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentName" className="text-sm">{t("parentInfoname")}</Label>
                <Input
                  id="parentName"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  placeholder={t("parentInfonamePlaceholder")}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentPhone" className="text-sm">{t("parentInfophone")}</Label>
                <Input
                  id="parentPhone"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleInputChange}
                  placeholder={t("parentInfophonePlaceholder")}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Enrollment Flow */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t("enrollmenttitle")}</h3>
            
            {loadingSubjects ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                {t("enrollmentnoSubjects")}
              </p>
            ) : (
              <div className="space-y-3">
                {/* Step 1: Select Grade */}
                <div>
                  <Label className="text-xs mb-2 block">{t("enrollmentstep1title")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableGrades.map((grade) => (
                      <Badge
                        key={grade}
                        onClick={() => {
                          setSelectedGrade(grade)
                          setSelectedSubject(null)
                          setSelectedTeacher("")
                        }}
                        variant={selectedGrade === grade ? "default" : "outline"}
                        className="cursor-pointer"
                      >
                        {grade}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Step 2: Select Subject */}
                {selectedGrade && (
                  <div>
                    <Label className="text-xs mb-2 block">{t("enrollmentstep2title")}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                      {subjectsForGrade.map((subject) => (
                        <Button
                          key={subject.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(subject)
                            setSelectedTeacher("")
                          }}
                          disabled={subject.teacherSubjects.length === 0}
                          variant={selectedSubject?.id === subject.id ? "default" : "outline"}
                          className="h-auto py-2 px-3 justify-start text-left text-xs"
                          size="sm"
                        >
                          <div className="w-full min-w-0">
                            <div className="font-medium truncate">{subject.name}</div>
                            <div className="text-xs opacity-70">MAD {subject.price}</div>
                            {subject.teacherSubjects.length === 0 && (
                              <div className="text-xs text-destructive mt-1">{t("enrollmentnoTeachersAssigned")}</div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Select Teacher */}
                {selectedSubject && (
                  <div>
                    <Label className="text-xs mb-2 block">
                      {t("enrollmentstep3title", { subject: selectedSubject.name })}
                    </Label>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto">
                      {teachersForSubject.map((ts) => (
                        <Button
                          key={ts.id}
                          type="button"
                          onClick={() => setSelectedTeacher(ts.teacherId)}
                          variant={selectedTeacher === ts.teacherId ? "default" : "outline"}
                          className="w-full h-auto py-2 justify-start text-left text-xs"
                          size="sm"
                        >
                          {ts.teacher.name}
                        </Button>
                      ))}
                    </div>

                    {selectedTeacher && (
                      <Button
                        type="button"
                        onClick={handleAddEnrollment}
                        className="mt-2 w-full"
                        size="sm"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t("enrollmentaddButton")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enrolled Subjects List */}
          {enrolledSubjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-muted-foreground">{t("enrolledSubjectstitle")}</h3>
                <span className="text-sm font-bold text-primary">MAD {totalPrice.toFixed(2)}</span>
              </div>
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {enrolledSubjects.map((es, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="py-2 px-3 flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">{es.subjectName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({es.teacherName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">MAD {es.price}</span>
                        <Button
                          type="button"
                          onClick={() => handleRemoveEnrollment(es.subjectId, es.teacherId)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("actionscancel")}
            </Button>
            <Button type="submit" disabled={isLoading || enrolledSubjects.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("actionscreating")}
                </>
              ) : (
                t("actionssubmit")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

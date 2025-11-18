/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { studentActions, studentSubjectActions, subjectActions, teacherSubjectActions, teacherActions } from "@/lib/dexie/dexieActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useAuth } from "@/context/authContext"

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

export default function CreateStudentForm() {
  const t = useTranslations("CreateStudentForm")
  const router = useRouter()
  const { user } = useAuth() // ✅ Get current user from AuthContext
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

  // Enrolled subjects list
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([])

  // Fetch available subjects with their teachers
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        // ✅ Fetch from local DB and join with teachers
        const [allSubjects, allTeacherSubjects, allTeachers] = await Promise.all([
          subjectActions.getAll(),
          teacherSubjectActions.getAll(),
          teacherActions.getAll()
        ])

        const activeSubjects = allSubjects.filter(s => s.status !== '0')
        const activeTeacherSubjects = allTeacherSubjects.filter(ts => ts.status !== '0')
        const activeTeachers = allTeachers.filter(t => t.status !== '0')

        // ✅ Build subjects with teacher associations
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

        // ✅ Commented out online fetch
        // const response = await fetch("/api/subjects?includeTeachers=true")
        // if (response.ok) {
        //   const data = await response.json()
        //   setSubjects(data)
        // }
      } catch (err) {
        console.error("Failed to fetch subjects:", err)
        setError(t("errorsfetchSubjects"))
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Get unique grades from subjects
  const availableGrades = [...new Set(subjects.map((s) => s.grade))].sort()

  // Filter subjects by selected grade
  const subjectsForGrade = selectedGrade ? subjects.filter((s) => s.grade === selectedGrade) : []

  // Get teachers for selected subject
  const teachersForSubject = selectedSubject?.teacherSubjects?.filter((ts) => ts.teacher) || []

  const handleAddEnrollment = () => {
    if (!selectedSubject || !selectedTeacher) {
      setError(t("errorsselectSubjectTeacher"))
      return
    }

    // Check if already enrolled
    const alreadyEnrolled = enrolledSubjects.some(
      (es) => es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher,
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

    // Reset enrollment selection
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

      // ✅ Check if email already exists in local DB
      if (formData.email) {
        const existingStudent = await studentActions.getLocalByEmail?.(formData.email)
        if (existingStudent) {
          setError("Email already in use")
          setIsLoading(false)
          return
        }
      }

      // ✅ Create student in local DB
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
        grade: formData.grade || undefined,
        managerId: user.id,
        status: 'w' as const, // Waiting for sync
        createdAt: now,
        updatedAt: now,
      }

      await studentActions.putLocal(newStudent)

      // ✅ Create student-subject-teacher associations in local DB
      const studentSubjectEntities = enrolledSubjects.map((es) => ({
        id: generateObjectId(),
        studentId: studentId,
        subjectId: es.subjectId,
        teacherId: es.teacherId,
        managerId: user.id,
        enrolledAt: now,
        status: 'w' as const, // Waiting for sync
        createdAt: now,
        updatedAt: now,
      }))

      await studentSubjectActions.bulkPutLocal(studentSubjectEntities)

      // ✅ Navigate to students page
      await router.push("/manager/students")
      router.refresh()

      // ✅ Commented out online creation
      // const response = await fetch("/api/students", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     ...formData,
      //     enrollments: enrolledSubjects.map((es) => ({
      //       subjectId: es.subjectId,
      //       teacherId: es.teacherId,
      //     })),
      //   }),
      // })
      // if (!response.ok) {
      //   const data = await response.json()
      //   throw new Error(data.error || t("errorsgeneric"))
      // }
    } catch (err: any) {
      setError(err.message || t("errorsgeneric"))
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate total price
  const totalPrice = enrolledSubjects.reduce((total, es) => total + es.price, 0)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Info */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("studentInfotitle")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("studentInfofullName")}</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("studentInfofullNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">{t("studentInfograde")}</Label>
                  <Input
                    type="text"
                    id="grade"
                    name="grade"
                    value={formData.grade || selectedGrade}
                    readOnly
                    placeholder={t("studentInfograde")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("studentInfoemail")}</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("studentInfoemailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("studentInfophone")}</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t("studentInfophonePlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Parent/Guardian Info */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("parentInfotitle")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">{t("parentInfoname")}</Label>
                  <Input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    placeholder={t("parentInfonamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">{t("parentInfophone")}</Label>
                  <Input
                    type="tel"
                    id="parentPhone"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder={t("parentInfophonePlaceholder")}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="parentEmail">{t("parentInfoemail")}</Label>
                  <Input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    placeholder={t("parentInfoemailPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Enrollment Flow */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("enrollmenttitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("enrollmentsubtitle")}</p>

              {loadingSubjects ? (
                <p className="text-muted-foreground text-center py-4">{t("enrollmentloading")}</p>
              ) : subjects.length === 0 ? (
                <Card className="bg-muted">
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    {t("enrollmentnoSubjects")}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Step 1: Select Grade */}
<div>
  <Label className="text-base mb-3 block">
    {t("enrollmentstep1title")}
  </Label>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-cols-max">
    {availableGrades.map((grade) => (
      <Button
        key={grade}
        type="button"
        onClick={() => {
          setSelectedGrade(grade)
          setSelectedSubject(null)
          setSelectedTeacher("");
        }}
        variant={selectedGrade === grade ? "default" : "outline"}
        className="w-fit px-4"
      >
        {grade}
      </Button>
    ))}
  </div>
</div>


                  {/* Step 2: Select Subject */}
                  {selectedGrade && (
                    <div>
                      <Label className="text-base mb-3 block">{t("enrollmentstep2title")}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subjectsForGrade.length === 0 ? (
                          <p className="text-muted-foreground col-span-2">{t("enrollmentnoSubjectsForGrade")}</p>
                        ) : (
                          subjectsForGrade.map((subject) => (
                            <Button
                              key={subject.id}
                              type="button"
                              onClick={() => {
                                setSelectedSubject(subject)
                                setSelectedTeacher("")
                              }}
                              disabled={subject.teacherSubjects.length === 0}
                              variant={selectedSubject?.id === subject.id ? "default" : "outline"}
                              className="h-auto w-auto gap-2 p-4 justify-start text-left"
                            >
                              <div className="w-full flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{subject.name}</h4>
                                  {subject.duration && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {subject.duration} {t("hours")}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {subject.teacherSubjects.length} {t("enrollmentteachersAvailable")}
                                  </p>
                                </div>
                                <p className="text-lg font-bold text-primary">{subject.price.toFixed(2)} درهم</p>
                              </div>
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Select Teacher */}
                  {selectedSubject && (
                    <div>
                      <Label className="text-base mb-3 block">
                        {t("enrollmentstep3title", { subject: selectedSubject.name })}
                      </Label>
                      {teachersForSubject.length === 0 ? (
                        <Card className="bg-muted">
                          <CardContent className="pt-6 text-center text-muted-foreground">
                            {t("enrollmentnoTeachers")}
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {teachersForSubject.map((ts) => (
                            <Button
                              key={ts.id}
                              type="button"
                              onClick={() => setSelectedTeacher(ts.teacherId)}
                              variant={selectedTeacher === ts.teacherId ? "default" : "outline"}
                              className="h-auto p-4 justify-start w-full"
                            >
                              <div className="flex items-center justify-between w-full">
  
                                    <h4 className="font-semibold">{ts.teacher.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {ts.teacher.email || ts.teacher.phone || t("enrollmentnoContactInfo")}
                                    </p>
                                </div>
                            </Button>
                          ))}
                        </div>
                      )}

                      {selectedTeacher && (
                        <Button type="button" onClick={handleAddEnrollment} className="mt-4 w-full">
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
              <div className="border-b pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{t("enrolledSubjectstitle")}</h2>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t("enrolledSubjectstotalPrice")}</p>
                    <p className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} درهم</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {enrolledSubjects.map((es, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{es.subjectName}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {t("enrolledSubjectsgradeLabel")}: {es.grade} | {t("enrolledSubjectsteacherLabel")}: {es.teacherName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{es.price.toFixed(2)} درهم</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleRemoveEnrollment(es.subjectId, es.teacherId)}
                            variant="ghost"
                            size="sm"
                            className="ml-4 text-destructive hover:text-destructive"
                            title={t("enrolledSubjectsremoveTooltip")}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 flex-wrap">
              <Button type="button" onClick={() => router.back()} variant="outline" disabled={isLoading}>
                {t("actionscancel")}
              </Button>
              <Button type="submit" disabled={isLoading || enrolledSubjects.length === 0}>
                {isLoading ? t("actionscreating") : t("actionssubmit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

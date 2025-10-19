/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"

import axios from "axios"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

interface StudentSubject {
  id: string
  subjectId: string
  teacherId: string
  subject: Subject
  teacher: Teacher
}

interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  parentEmail: string | null
  grade: string | null
  studentSubjects: StudentSubject[]
}

interface EnrolledSubject {
  subjectId: string
  teacherId: string
  subjectName: string
  teacherName: string
  grade: string
  price: number
}

export default function EditStudentForm() {
  const t = useTranslations("editStudent")
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
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

  // Fetch student data and subjects
  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const [studentRes, subjectsRes] = await Promise.all([
        fetch(`/api/students/${params.id}`),
        fetch("/api/subjects?includeTeachers=true"),
      ])

      if (!studentRes.ok) throw new Error("Failed to fetch student")
      if (!subjectsRes.ok) throw new Error("Failed to fetch subjects")

      const studentData: Student = await studentRes.json()
      const subjectsData: Subject[] = await subjectsRes.json()

      setStudent(studentData)
      setSubjects(subjectsData)

      // Set form data
      setFormData({
        name: studentData.name,
        email: studentData.email || "",
        phone: studentData.phone || "",
        parentName: studentData.parentName || "",
        parentPhone: studentData.parentPhone || "",
        parentEmail: studentData.parentEmail || "",
        grade: studentData.grade || "",
      })

      // Set enrolled subjects
      setEnrolledSubjects(
        studentData.studentSubjects.map((ss) => ({
          subjectId: ss.subject.id,
          teacherId: ss.teacher.id,
          subjectName: ss.subject.name,
          teacherName: ss.teacher.name,
          grade: ss.subject.grade,
          price: ss.subject.price,
        })),
      )
    } catch (err) {
      console.error("Failed to fetch data:", err)
      setError(t("fetchStudent"))
    } finally {
      setIsFetching(false)
      setLoadingSubjects(false)
    }
  }

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
      setError(t("fetchSubjects"))
      return
    }

    // Check if already enrolled in this subject with this teacher
    const alreadyEnrolled = enrolledSubjects.some(
      (es) => es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher,
    )

    if (alreadyEnrolled) {
      setError(t("alreadyEnrolled"))
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

    // Reset enrollment flow
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

    try {
      if (!formData.name) {
        throw new Error("Student name is required")
      }

      if (enrolledSubjects.length === 0) {
        throw new Error("Please enroll the student in at least one subject")
      }

      const response = await axios.patch(
        `/api/students/${params.id}`,
        {
          ...formData,
          enrollments: enrolledSubjects.map((es) => ({
            subjectId: es.subjectId,
            teacherId: es.teacherId,
          })),
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )

      if (!response.data) {
        throw new Error(response.data || "Failed to update student")
      }

      router.push(`/manager/students/${params.id}`)
    } catch (err) {
      console.log(err instanceof Error ? err.message : t("somethingWentWrong"))
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate total price
  const totalPrice = enrolledSubjects.reduce((total, es) => total + es.price, 0)

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{t("studentInfo")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="w-6 h-6" />
          </Button>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("studentInfo")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("fullName")}</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("fullName")}
                  />
                </div>

                <div className="space-y-2 hidden">
                  <Label htmlFor="grade">{t("grade")}</Label>
                  <Input
                    type="text"
                    id="grade"
                    name="grade"
                    value={formData.grade || selectedGrade}
                    readOnly
                    onChange={handleInputChange}
                    placeholder={t("grade")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="student@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+212 612312300"
                  />
                </div>
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("parentInfo")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">{t("parentName")}</Label>
                  <Input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">{t("parentPhone")}</Label>
                  <Input
                    type="tel"
                    id="parentPhone"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="parentEmail">{t("parentEmail")}</Label>
                  <Input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    placeholder="parent@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Current Enrollments */}
            {enrolledSubjects.length > 0 && (
              <div className="border-b pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{t("currentEnrollments")}</h2>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t("totalPrice")}</p>
                    <p className="text-2xl font-bold text-primary">MAD{totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {enrolledSubjects.map((es, index) => (
                    <Card key={index} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold">{es.subjectName}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {t("grade")}: {es.grade} • {t("teacher")}: {es.teacherName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">MAD{es.price.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEnrollment(es.subjectId, es.teacherId)}
                            className="ml-4 text-destructive hover:text-destructive"
                            title={t("removeEnrollment")}
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

            {/* Add New Subject Enrollment */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("addNewSubject")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("selectGradeSubjectTeacher")}</p>

              {loadingSubjects ? (
                <p className="text-muted-foreground text-center py-4">{t("loadingSubjects")}</p>
              ) : subjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 bg-muted rounded-md">{t("noSubjectsAvailable")}</p>
              ) : (
                <div className="space-y-6">
                  {/* Step 1: Select Grade */}
                  <div>
                    <Label className="mb-3 block">{t("step1SelectGrade")}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableGrades.map((grade) => (
                        <Button
                          key={grade}
                          type="button"
                          variant={selectedGrade === grade ? "default" : "outline"}
                          onClick={() => {
                            setSelectedGrade(grade)
                            setSelectedSubject(null)
                            setSelectedTeacher("")
                          }}
                          className="w-full"
                        >
                          {grade}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Select Subject */}
                  {selectedGrade && (
                    <div>
                      <Label className="mb-3 block">{t("step2SelectSubject")}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subjectsForGrade.length === 0 ? (
                          <p className="text-muted-foreground col-span-2">{t("noSubjectsAvailable")}</p>
                        ) : (
                          subjectsForGrade
                            .filter((subject) => !enrolledSubjects.some((es) => es.subjectId === subject.id))
                            .map((subject) => (
                              <Button
                                key={subject.id}
                                type="button"
                                variant={selectedSubject?.id === subject.id ? "default" : "outline"}
                                onClick={() => {
                                  setSelectedSubject(subject)
                                  setSelectedTeacher("")
                                }}
                                disabled={subject.teacherSubjects && subject.teacherSubjects.length === 0}
                                className="h-auto p-4 text-left justify-start"
                              >
                                <div className="w-full">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold">{subject.name}</h4>
                                      {subject.duration && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {subject.duration} {t("minutes")}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {subject.teacherSubjects && subject.teacherSubjects.length}{" "}
                                        {t("teachersAvailable")}
                                      </p>
                                    </div>
                                    <p className="text-lg font-bold text-primary">MAD{subject.price.toFixed(2)}</p>
                                  </div>
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
                      <Label className="mb-3 block">
                        {t("step3SelectTeacher")} {selectedSubject.name}
                      </Label>
                      {teachersForSubject && teachersForSubject.length === 0 ? (
                        <p className="text-muted-foreground bg-muted p-4 rounded-md">{t("noTeachersAvailable")}</p>
                      ) : (
                        <div className="space-y-3">
                          {teachersForSubject &&
                            teachersForSubject.map((ts) => (
                              <Button
                                key={ts.id}
                                type="button"
                                variant={selectedTeacher === ts.teacherId ? "default" : "outline"}
                                onClick={() => setSelectedTeacher(ts.teacherId)}
                                className="w-full h-auto p-4 text-left justify-start"
                              >
                                <div className="w-full flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <Avatar>
                                      <AvatarFallback>{ts.teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-semibold">{ts.teacher.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {ts.teacher.email || ts.teacher.phone || t("noContactInfo")}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">{t("compensation")}</p>
                                    <p className="font-semibold">
                                      {ts.percentage
                                        ? `${ts.percentage}% ($${((selectedSubject.price * ts.percentage) / 100).toFixed(2)})`
                                        : `$${ts.hourlyRate}/hr`}
                                    </p>
                                  </div>
                                </div>
                              </Button>
                            ))}
                        </div>
                      )}

                      {/* Add Button */}
                      {selectedTeacher && (
                        <Button type="button" onClick={handleAddEnrollment} className="mt-4 w-full">
                          {t("addEnrollment")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || enrolledSubjects.length === 0}>
                {isLoading ? t("saving") : t("saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

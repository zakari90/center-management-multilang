"use client"

import PdfExporter from "@/components/pdfExporter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import axios from "axios" // ✅ Commented out - using local DB
import { AlertCircle, Edit, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { 
  teacherActions, 
  teacherSubjectActions, 
  subjectActions 
} from "@/lib/dexie/dexieActions"

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
  weeklySchedule: DaySchedule[]
  teacherSubjects: TeacherSubject[]
}

interface TeacherDetailContentProps {
  teacherId: string
  isModal?: boolean
}

export function TeacherDetailContent({ teacherId, isModal = false }: TeacherDetailContentProps) {
  const router = useRouter()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const t = useTranslations("TeacherProfile")

  const fetchTeacher = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      // ✅ Fetch from local DB
      const [allTeachers, allTeacherSubjects, allSubjects] = await Promise.all([
        teacherActions.getAll(),
        teacherSubjectActions.getAll(),
        subjectActions.getAll()
      ])

      // ✅ Find teacher by ID
      const teacherData = allTeachers.find(t => t.id === teacherId && t.status !== '0')
      
      if (!teacherData) {
        throw new Error(t("notFound"))
      }

      // ✅ Get teacher subjects
      const teacherSubjectsData = allTeacherSubjects
        .filter(ts => ts.teacherId === teacherId && ts.status !== '0')
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

      // ✅ Parse weekly schedule
      let weeklyScheduleData: DaySchedule[] = []
      if (teacherData.weeklySchedule) {
        try {
          const schedule = typeof teacherData.weeklySchedule === 'string' 
            ? JSON.parse(teacherData.weeklySchedule) 
            : teacherData.weeklySchedule
          
          if (Array.isArray(schedule)) {
            weeklyScheduleData = schedule.map((s: unknown) => {
              const parsed = typeof s === 'string' ? JSON.parse(s) : s
              return {
                day: parsed.day,
                startTime: parsed.startTime,
                endTime: parsed.endTime,
                isAvailable: true,
              }
            })
          }
        } catch (e) {
          console.error('Error parsing weekly schedule:', e)
        }
      }

      // ✅ Build teacher data matching the interface
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

      // ✅ Commented out API call
      // const res = await axios.get(`/api/teachers/${teacherId}`)
      // setTeacher(res.data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t("errorLoad"))
    } finally {
      setIsLoading(false)
    }
  }, [teacherId, t])

  useEffect(() => {
    if (teacherId) {
      fetchTeacher()
    }
  }, [teacherId, fetchTeacher])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className={isModal ? "p-4" : "max-w-3xl mx-auto p-6"}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || t("notFound")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const content = (
    <>
      <PdfExporter>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <CardTitle className={isModal ? "text-xl font-semibold" : "text-2xl font-semibold"}>{teacher.name}</CardTitle>
              <CardDescription className="mt-1">{t("overview")}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className={`${isModal ? "space-y-3" : "space-y-4"}`}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("email")}</p>
                <p className="font-medium">{teacher.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("phone")}</p>
                <p className="font-medium">{teacher.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("address")}</p>
                <p className="font-medium">{teacher.address || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalSubjects")}</p>
                <p className="font-medium">{teacher.teacherSubjects?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>{t("subjectsTitle")}</CardTitle>
            <CardDescription>{t("subjectsDesc")}</CardDescription>
          </CardHeader>

          <CardContent className={isModal ? "space-y-3" : "space-y-4"}>
            {teacher.teacherSubjects?.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSubjects")}</p>
            ) : (
              teacher.teacherSubjects.map((ts) => (
                <div
                  key={ts.id}
                  className="border p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{ts.subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("grade")}: {ts.subject.grade}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 space-x-2">
                    {ts.percentage ? (
                      <Badge variant="secondary">{ts.percentage}%</Badge>
                    ) : ts.hourlyRate ? (
                      <Badge variant="secondary">${ts.hourlyRate}/hr</Badge>
                    ) : (
                      <Badge>{t("noCompensation")}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{t("scheduleTitle")}</CardTitle>
            <CardDescription>{t("scheduleDesc")}</CardDescription>
          </CardHeader>
          <CardContent className={isModal ? "space-y-2" : ""}>
            {teacher.weeklySchedule?.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSchedule")}</p>
            ) : (
              <div className="space-y-2">
                {teacher.weeklySchedule.map((day) => (
                  <div key={day.day} className="flex justify-between items-center border rounded-md p-3">
                    <span className="font-medium">{day.day}</span>
                    {day.isAvailable ? (
                      <span className="text-sm text-muted-foreground">
                        {day.startTime} – {day.endTime}
                      </span>
                    ) : (
                      <Badge variant="outline">{t("unavailable")}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PdfExporter>
      {!isModal && (
        <div className="mt-6">
          <Button onClick={() => router.push(`/manager/teachers/${teacher.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("edit")}
          </Button>
        </div>
      )}
    </>
  )

  if (isModal) {
    return <div className={`p-2 ${isModal ? "space-y-4" : "space-y-6"}`}>{content}</div>
  }

  return <div className="max-w-3xl mx-auto p-6 space-y-6">{content}</div>
}


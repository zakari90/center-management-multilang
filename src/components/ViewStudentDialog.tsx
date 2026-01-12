"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Eye, Loader2, Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  receiptActions
} from "@/lib/dexie/dexieActions"

interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
  }
  teacher: {
    id: string
    name: string
  }
  enrolledAt: string
}

interface Receipt {
  id: string
  receiptNumber: string
  amount: number
  date: string
  paymentMethod: string | null
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
  createdAt: string
  studentSubjects: StudentSubject[]
  receipts: Receipt[]
}

interface ViewStudentDialogProps {
  studentId: string
  trigger?: React.ReactNode
}

export default function ViewStudentDialog({ studentId, trigger }: ViewStudentDialogProps) {
  const t = useTranslations("StudentProfile")
  const [open, setOpen] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchStudent = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const [allStudents, allStudentSubjects, allSubjects, allTeachers, allReceipts] = await Promise.all([
        studentActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        teacherActions.getAll(),
        receiptActions.getAll()
      ])

      const studentData = allStudents.find(s => s.id === studentId && s.status !== '0')
      if (!studentData) {
        throw new Error(t("notFound"))
      }

      const studentSubjectsData = allStudentSubjects
        .filter(ss => ss.studentId === studentId && ss.status !== '0')
        .map(ss => {
          const subject = allSubjects.find(s => s.id === ss.subjectId && s.status !== '0')
          const teacher = allTeachers.find(t => t.id === ss.teacherId && t.status !== '0')
          if (!subject) return null
          return {
            id: ss.id,
            subject: {
              id: subject.id,
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
            },
            teacher: teacher ? {
              id: teacher.id,
              name: teacher.name,
            } : { id: '', name: t("unknown") },
            enrolledAt: new Date(ss.enrolledAt || ss.createdAt).toLocaleDateString(),
          }
        })
        .filter(ss => ss !== null) as StudentSubject[]

      const studentReceipts = allReceipts
        .filter(r => r.studentId === studentId && r.status !== '0')
        .map(r => ({
          id: r.id,
          receiptNumber: r.receiptNumber || r.id.slice(-6).toUpperCase(),
          amount: r.amount,
          date: new Date(r.createdAt).toLocaleDateString(),
          paymentMethod: r.paymentMethod ?? null,
        }))

      setStudent({
        id: studentData.id,
        name: studentData.name,
        email: studentData.email ?? null,
        phone: studentData.phone ?? null,
        parentName: studentData.parentName ?? null,
        parentPhone: studentData.parentPhone ?? null,
        parentEmail: studentData.parentEmail ?? null,
        grade: studentData.grade ?? null,
        createdAt: new Date(studentData.createdAt).toLocaleDateString(),
        studentSubjects: studentSubjectsData,
        receipts: studentReceipts,
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t("errorLoad"))
    } finally {
      setIsLoading(false)
    }
  }, [studentId, t])

  useEffect(() => {
    if (open && studentId) {
      fetchStudent()
    }
  }, [open, studentId, fetchStudent])

  const totalMonthlyFee = student?.studentSubjects.reduce(
    (sum, ss) => sum + ss.subject.price,
    0
  ) || 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" title={t("viewDetails")}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {student && (
              <>
                <Avatar>
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {student.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span>{student.name}</span>
                  {student.grade && (
                    <Badge variant="outline" className="ml-2">{student.grade}</Badge>
                  )}
                </div>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !student ? (
          <Alert variant="destructive">
            <AlertDescription>{error || t("notFound")}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("contactInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone || "—"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Parent Info */}
            {(student.parentName || student.parentPhone) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("parentInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("name")}</p>
                    <p className="font-medium">{student.parentName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("phone")}</p>
                    <p className="font-medium">{student.parentPhone || "—"}</p>
                  </div>
                  {student.parentEmail && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t("email")}</p>
                      <p className="font-medium">{student.parentEmail}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Enrolled Subjects */}
            <Card>
              <CardHeader className="pb-3 flex flex-row justify-between items-center">
                <CardTitle className="text-base">{t("enrolledSubjects")}</CardTitle>
                <Badge variant="secondary">
                  MAD {totalMonthlyFee.toFixed(2)}/{t("month")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.studentSubjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noSubjects")}</p>
                ) : (
                  student.studentSubjects.map((ss) => (
                    <div
                      key={ss.id}
                      className="border p-3 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{ss.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ss.teacher.name} • {ss.subject.grade}
                        </p>
                      </div>
                      <Badge>MAD {ss.subject.price}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Receipts */}
            {student.receipts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("recentPayments")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {student.receipts.slice(0, 3).map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">#{receipt.receiptNumber}</p>
                        <p className="text-xs text-muted-foreground">{receipt.date}</p>
                      </div>
                      <Badge variant="outline">MAD {receipt.amount.toFixed(2)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Joined Date */}
            <p className="text-xs text-muted-foreground text-center">
              {t("memberSince")}: {student.createdAt}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

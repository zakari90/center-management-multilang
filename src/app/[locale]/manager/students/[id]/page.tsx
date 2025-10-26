// /manager/students/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { useTranslations } from "next-intl"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
    duration: number | null
  }
  enrolledAt: string
}

interface Receipt {
  id: string
  receiptNumber: string
  amount: number
  date: string
  paymentMethod: string | null
  description: string | null
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

export default function StudentDetailPage() {
  const t = useTranslations("StudentDetailPage")
  const params = useParams()
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStudent()
  }, [params])

  const fetchStudent = async () => {
    try {
      const {data} = await axios.get(`/api/students/${params.id}`)
      if (!data) throw new Error(t("errorFetchStudent"))
      setStudent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || t("studentNotFound")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalRevenue = student.studentSubjects.reduce((total, ss) => total + ss.subject.price, 0)
  const totalPaid = student.receipts.reduce((total, receipt) => total + receipt.amount, 0)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{student.name}</h1>
            <p className="text-muted-foreground mt-1">
              {t("studentSince")} {new Date(student.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button asChild>
            <Link href={`/manager/students/${student.id}/edit`}>{t("editStudent")}</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">{t("enrolledSubjects")}</p>
            <p className="text-3xl font-bold text-primary">{student.studentSubjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">{t("totalRevenue")}</p>
            <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">{t("totalPaid")}</p>
            <p className="text-3xl font-bold text-purple-600">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contactInformation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <p className="text-foreground">{student.email || t("notProvided")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("phone")}</p>
                  <p className="text-foreground">{student.phone || t("notProvided")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("gradeLevel")}</p>
                  <p className="text-foreground">{student.grade || t("notProvided")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("parentGuardian")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("name")}</p>
                  <p className="text-foreground">{student.parentName || t("notProvided")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("phone")}</p>
                  <p className="text-foreground">{student.parentPhone || t("notProvided")}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <p className="text-foreground">{student.parentEmail || t("notProvided")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Subjects */}
          <Card>
            <CardHeader>
              <CardTitle>{t("enrolledSubjects")}</CardTitle>
            </CardHeader>
            <CardContent>
              {student.studentSubjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t("noSubjectsEnrolled")}</p>
              ) : (
                <div className="space-y-3">
                  {student.studentSubjects.map((ss) => (
                    <div key={ss.id} className="p-4 bg-muted rounded-md flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{ss.subject.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ss.subject.grade}
                          {ss.subject.duration && ` • ${ss.subject.duration} ${t("minutes")}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("enrolledOn")} {new Date(ss.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">${ss.subject.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("paymentHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {student.receipts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t("noPaymentsYet")}</p>
              ) : (
                <div className="space-y-3">
                  {student.receipts.map((receipt) => (
                    <div key={receipt.id} className="p-3 bg-muted rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">${receipt.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{receipt.receiptNumber}</p>
                        </div>
                        {receipt.paymentMethod && <Badge variant="secondary">{receipt.paymentMethod}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(receipt.date).toLocaleDateString()}</p>
                      {receipt.description && (
                        <p className="text-xs text-muted-foreground mt-1">{receipt.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button asChild className="mt-4 w-full" variant="default">
                <Link href={`/receipts/create?studentId=${student.id}`}>{t("addPayment")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

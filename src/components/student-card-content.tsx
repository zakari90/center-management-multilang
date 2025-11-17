"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import StudentCard from "@/components/studentCard"
import PdfExporter from "@/components/pdfExporter"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { studentActions } from "@/lib/dexie/dexieActions"

interface Student {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  grade?: string | null
  [key: string]: unknown
}

interface StudentCardContentProps {
  studentId: string
  isModal?: boolean
}

export function StudentCardContent({ studentId, isModal = false }: StudentCardContentProps) {
  const t = useTranslations("StudentCardPage")
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // ✅ Fetch from local DB
      const allStudents = await studentActions.getAll()
      const studentData = allStudents.find(s => s.id === studentId && s.status !== '0')
      
      if (!studentData) {
        setError(t("studentNotFound"))
        return
      }

      // ✅ Build student data
      const studentResult: Student = {
        id: studentData.id,
        name: studentData.name,
        email: studentData.email ?? null,
        phone: studentData.phone ?? null,
        grade: studentData.grade ?? null,
      }

      setStudent(studentResult)

      // ✅ Commented out API call
      // const response = await fetch(`/api/students/${studentId}`)
      // if (response.ok) {
      //   const data = await response.json()
      //   setStudent(data)
      // } else {
      //   setError(t("studentNotFound"))
      // }
    } catch (err) {
      console.error(t("errorFetchStudent"), err)
      setError(t("errorFetchStudent"))
    } finally {
      setLoading(false)
    }
  }, [studentId, t])

  useEffect(() => {
    if (studentId) {
      fetchStudent()
    }
  }, [studentId, fetchStudent])

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isModal ? "h-64" : "min-h-screen"}`}>
        <Loader2 className="animate-spin rounded-full h-12 w-12" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className={isModal ? "p-4" : "min-h-screen flex items-center justify-center"}>
        <Alert variant="destructive">
          <AlertDescription>{error || t("studentNotFound")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const content = (
    <PdfExporter fileName={student.name}>
      <StudentCard student={student} showQR={true} />
    </PdfExporter>
  )

  if (isModal) {
    return <div className="p-2">{content}</div>
  }

  return <div className="min-h-screen py-12 px-4">{content}</div>
}


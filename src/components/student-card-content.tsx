"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import StudentCard from "@/components/studentCard"
import PdfExporter from "@/components/pdfExporter"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StudentCardContentProps {
  studentId: string
  isModal?: boolean
}

export function StudentCardContent({ studentId, isModal = false }: StudentCardContentProps) {
  const t = useTranslations("StudentCardPage")
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${studentId}`)
        if (response.ok) {
          const data = await response.json()
          setStudent(data)
        } else {
          setError(t("studentNotFound"))
        }
      } catch (err) {
        console.error(t("errorFetchStudent"), err)
        setError(t("errorFetchStudent"))
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchStudent()
    }
  }, [studentId, t])

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


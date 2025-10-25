/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import StudentCard from '@/components/studentCard'
import PdfExporter from '@/components/pdfExporter'
import { Loader2 } from 'lucide-react'

export default function StudentCardPage() {
  const t = useTranslations('StudentCardPage')
  const params = useParams()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setStudent(data)
        }
      } catch (error) {
        console.error(t('errorFetchStudent'), error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [params.id, t])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 "/>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('studentNotFound')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PdfExporter fileName={student.name} >
        <StudentCard student={student} showQR={true} />
      </PdfExporter>
    </div>
  )
}
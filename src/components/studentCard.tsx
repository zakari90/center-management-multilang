'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'

interface Subject {
  id: string
  name: string
  grade: string
}

interface Teacher {
  id: string
  name: string
}

interface StudentSubject {
  id: string
  subject: Subject
  teacher: Teacher
}

interface StudentCardProps {
  student: {
    id: string
    name: string
    grade: string | null
    email: string | null
    phone: string | null
    studentSubjects: StudentSubject[]
  }
  showQR?: boolean
}

export default function StudentCard({ student, showQR = true }: StudentCardProps) {
  const t = useTranslations('StudentCard')
  const cardRef = useRef<HTMLDivElement>(null)

  const studentUrl = `${window.location.origin}/student/${student.id}`
  const grades = [...new Set(student.studentSubjects.map(ss => ss.subject.grade))].join(', ')
  const displayGrade = student.grade || grades || 'N/A'

  return (
    <Card ref={cardRef} className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('idLabel')}: #{student.id.slice(0, 8)}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">{student.name}</h2>
          <p className="text-sm text-muted-foreground">{t('studentInfo.gradeLabel')}: {displayGrade}</p>
          {student.email && <p className="text-sm text-muted-foreground">{t('studentInfo.emailLabel')}: {student.email}</p>}
          {student.phone && <p className="text-sm text-muted-foreground">{t('studentInfo.phoneLabel')}: {student.phone}</p>}
        </div>

        <Separator />

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{t('subjects.title')}</h3>
            <Badge variant="secondary">{student.studentSubjects.length}</Badge>
          </div>
          {student.studentSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('subjects.noSubjects')}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {student.studentSubjects.map((ss) => (
                <div key={ss.id} className="p-2 rounded-md border border-border flex justify-between items-center">
                  <div>
                    <p className="font-medium">{ss.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{t('subjects.gradePrefix')} {ss.subject.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('subjects.teacherLabel')}</p>
                    <p className="text-sm font-medium">{ss.teacher.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showQR && (
          <div className="flex justify-center mt-4">
            <QRCodeSVG value={studentUrl} size={120} level="H" includeMargin />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
      </CardFooter>
    </Card>
  )
}
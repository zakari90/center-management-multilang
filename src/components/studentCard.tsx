'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Edit } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'

interface Subject {
  id: string
  name: string
  grade: string
  price?: number
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
  editable?: boolean
}

export default function StudentCard({ 
  student, 
  showQR = true,
  editable = false
}: StudentCardProps) {
  const t = useTranslations('StudentCard')
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrGenerated, setQrGenerated] = useState(false)

  const grades = [...new Set(student.studentSubjects.map(ss => ss.subject.grade))].join(', ')
  const displayGrade = student.grade || grades || 'N/A'

  useEffect(() => {
    if (showQR && canvasRef.current && !qrGenerated) {
      QRCode.toCanvas(
        canvasRef.current,
        student.id,
        {
          width: 120,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) {
            console.error('QR Code generation error:', error)
          } else {
            setQrGenerated(true)
          }
        }
      )
    }
  }, [showQR, student.id, qrGenerated])
  return (
    <div className="space-y-4">
      <Card ref={cardRef} className="max-w-md mx-auto bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl sm:text-2xl">{t('title')}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('idLabel')}: #{student.id.slice(0, 8)}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Student Info */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold">{student.name}</h2>
            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
              <p>{t('studentInfo.gradeLabel')}: {displayGrade}</p>
              {student.email && <p>{t('studentInfo.emailLabel')}: {student.email}</p>}
              {student.phone && <p>{t('studentInfo.phoneLabel')}: {student.phone}</p>}
            </div>
          </div>

          <Separator />

          {/* Subjects */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm sm:text-base">
                {t('subjects.title')}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {student.studentSubjects.length}
              </Badge>
            </div>
            
            {student.studentSubjects.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('subjects.noSubjects')}
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {student.studentSubjects.map((ss) => (
                  <div 
                    key={ss.id} 
                    className="p-2 rounded-md border border-border text-xs sm:text-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{ss.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('subjects.gradePrefix')} {ss.subject.grade}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {t('subjects.teacherLabel')}
                        </p>
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {ss.teacher.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Code */}
{showQR && (
  <div className="flex justify-center pt-4">
    <div className="p-2 border-2  rounded-lg">
      <canvas 
        ref={canvasRef}
        className="max-w-full h-auto"
      />
    </div>
  </div>
)}
        </CardContent>

        <CardFooter className="flex gap-2 justify-end pt-4">
          {editable && (
            <Button 
              size="sm"
              onClick={() => router.push(`/students/${student.id}/edit`)}
              className="text-xs sm:text-sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
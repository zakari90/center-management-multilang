'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

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
  const cardRef = useRef<HTMLDivElement>(null)

  const studentUrl = `${window.location.origin}/student/${student.id}`
  const grades = [...new Set(student.studentSubjects.map(ss => ss.subject.grade))].join(', ')
  const displayGrade = student.grade || grades || 'N/A'

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${student.name}-card.pdf`)
  }

  return (
    <Card ref={cardRef} className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Student ID Card</CardTitle>
        <p className="text-sm text-muted-foreground">ID: #{student.id.slice(0, 8)}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Student Info */}
        <div>
          <h2 className="text-lg font-bold">{student.name}</h2>
          <p className="text-sm text-muted-foreground">Grade: {displayGrade}</p>
          {student.email && <p className="text-sm text-muted-foreground">Email: {student.email}</p>}
          {student.phone && <p className="text-sm text-muted-foreground">Phone: {student.phone}</p>}
        </div>

        <Separator />

        {/* Subjects */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Enrolled Subjects</h3>
            <Badge variant="secondary">{student.studentSubjects.length}</Badge>
          </div>
          {student.studentSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects enrolled</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {student.studentSubjects.map((ss) => (
                <div
                  key={ss.id}
                  className="p-2 rounded-md border border-border flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{ss.subject.name}</p>
                    <p className="text-xs text-muted-foreground">Grade {ss.subject.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Teacher</p>
                    <p className="text-sm font-medium">{ss.teacher.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="flex justify-center mt-4">
            <QRCodeSVG value={studentUrl} size={120} level="H" includeMargin />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={handleDownloadPdf}>Download PDF</Button>
      </CardFooter>
    </Card>
  )
}

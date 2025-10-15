// app/teachers/[id]/page.tsx
'use client'

import PdfExporter from '@/components/pdfExporter'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import { AlertCircle, Edit, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

export default function TeacherProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await axios.get(`/api/teachers/${id}`)
        setTeacher(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load teacher details')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchTeacher()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Teacher not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative max-w-3xl mx-auto p-6 space-y-8">
          <Button className='absolute top-25 right-25' onClick={() => router.push(`/teachers/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
      <PdfExporter >

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-semibold">{teacher.name}</CardTitle>
            <CardDescription>Teacher Profile Overview</CardDescription>
          </div>

        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{teacher.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{teacher.phone || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{teacher.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
              <p className="font-medium">{teacher.teacherSubjects?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects & Compensation</CardTitle>
          <CardDescription>List of subjects taught by this teacher</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {teacher.teacherSubjects?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
          ) : (
            teacher.teacherSubjects.map((ts) => (
              <div
                key={ts.id}
                className="border p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between"
              >
                <div>
                  <p className="font-medium">{ts.subject.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Grade: {ts.subject.grade}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 space-x-2">
                  {ts.percentage ? (
                    <Badge variant="secondary">{ts.percentage}%</Badge>
                  ) : ts.hourlyRate ? (
                    <Badge variant="secondary">${ts.hourlyRate}/hr</Badge>
                  ) : (
                    <Badge>No compensation set</Badge>
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
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Teacher’s availability</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.weeklySchedule?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedule available.</p>
          ) : (
            <div className="space-y-2">
              {teacher.weeklySchedule.map((day) => (
                <div
                  key={day.day}
                  className="flex justify-between items-center border rounded-md p-3"
                >
                  <span className="font-medium">{day.day}</span>
                  {day.isAvailable ? (
                    <span className="text-sm text-muted-foreground">
                      {day.startTime} – {day.endTime}
                    </span>
                  ) : (
                    <Badge variant="outline">Unavailable</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </PdfExporter>

    </div>
  )
}

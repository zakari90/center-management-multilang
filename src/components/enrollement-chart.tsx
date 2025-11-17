'use client'

import { useEffect, useState, useCallback } from 'react'
// import axios from 'axios' // ✅ Commented out - using localDB instead
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/authContext'
import { studentSubjectActions, subjectActions, studentActions } from '@/lib/dexie/dexieActions'

interface SubjectEnrollment {
  subject: string
  students: number
  revenue: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function EnrollmentChart() {
  const [data, setData] = useState<SubjectEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations('EnrollmentChart')
  const { user } = useAuth()

  const fetchEnrollmentData = useCallback(async () => {
    try {
      if (!user) return

      // ✅ Fetch from localDB instead of API
      const [studentSubjects, subjects, students] = await Promise.all([
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        studentActions.getAll(),
      ])

      // Filter by manager and status (exclude deleted items)
      const managerStudents = students.filter(s => 
        s.managerId === user.id && s.status !== '0'
      )
      const activeSubjects = subjects.filter(s => s.status !== '0')
      const activeEnrollments = studentSubjects.filter(ss => 
        ss.status !== '0' && managerStudents.some(s => s.id === ss.studentId)
      )

      // Group enrollments by subjectId
      const enrollmentMap = new Map<string, number>()
      activeEnrollments.forEach(enrollment => {
        const count = enrollmentMap.get(enrollment.subjectId) || 0
        enrollmentMap.set(enrollment.subjectId, count + 1)
      })

      // Join with subjects and calculate revenue
      const chartData = Array.from(enrollmentMap.entries())
        .map(([subjectId, students]) => {
          const subject = activeSubjects.find(s => s.id === subjectId)
          return {
            subject: subject?.name || 'Unknown',
            students,
            revenue: (subject?.price || 0) * students
          }
        })
        .sort((a, b) => b.students - a.students) // Sort by most students
        .slice(0, 6) // Take top 6 subjects

      setData(chartData)

      // ✅ Old API call - commented out
      // const { data } = await axios.get('/api/dashboard/enrollments')
      // setData(data)
    } catch (err) {
      console.error('Failed to fetch enrollment data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchEnrollmentData()
    }
  }, [user, fetchEnrollmentData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="subject" 
                angle={0}           // ← Changed to -45 for angled labels
                textAnchor="end"      // ← Keep this for angled text
                height={80}           // ← Reduced height
                interval={0}          // ← Show all labels
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return `MAD ${value.toFixed(2)}`
                  return value
                }}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend />
              <Bar
                dataKey="students"
                fill="#3b82f6"
                name={t('chart.students')}
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

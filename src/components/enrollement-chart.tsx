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
import { studentSubjectActions, subjectActions, studentActions, centerActions } from '@/lib/dexie/dexieActions'
import { getChartColorArray } from '@/lib/utils/themeColors'

interface SubjectEnrollment {
  subject: string
  students: number
  revenue: number
}

export default function EnrollmentChart() {
  const [data, setData] = useState<SubjectEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations('EnrollmentChart')
  const { user } = useAuth()

  const fetchEnrollmentData = useCallback(async () => {
    try {
      if (!user) return

      // ✅ Fetch from localDB instead of API
      const [studentSubjects, subjects, students, centers] = await Promise.all([
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        studentActions.getAll(),
        centerActions.getAll(),
      ])

      // ✅ Filter students based on role
      let relevantStudents = students.filter(s => s.status !== '0')
      
      if (user.role === 'ADMIN') {
        // For admin: get all centers owned by admin, then get all managers in those centers
        const adminCenters = centers.filter(c => 
          c.adminId === user.id && c.status !== '0'
        )
        const managerIds = new Set<string>()
        adminCenters.forEach(center => {
          if (Array.isArray(center.managers)) {
            center.managers.forEach((managerId: string) => managerIds.add(managerId))
          }
        })
        // Get all students managed by managers in admin's centers
        relevantStudents = students.filter(s => 
          s.status !== '0' && managerIds.has(s.managerId)
        )
      } else {
        // For manager: filter by managerId
        relevantStudents = students.filter(s => 
          s.managerId === user.id && s.status !== '0'
        )
      }

      const activeSubjects = subjects.filter(s => s.status !== '0')
      const activeEnrollments = studentSubjects.filter(ss => 
        ss.status !== '0' && relevantStudents.some(s => s.id === ss.studentId)
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
                contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px' }}
              />
              <Legend />
              <Bar
                dataKey="students"
                fill="var(--chart-1)"
                name={t('chart.students')}
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => {
                  const colors = getChartColorArray()
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

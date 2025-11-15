'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
// import axios from 'axios' // ✅ Commented out - using localDB instead
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/authContext'
import { subjectActions, studentSubjectActions, studentActions } from '@/lib/dexie/_dexieActions'

interface TopSubject {
  id: string
  name: string
  grade: string
  students: number
  revenue: number
  maxCapacity: number
}

export default function TopSubjects() {
  const [subjects, setSubjects] = useState<TopSubject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations('TopSubjects')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchTopSubjects()
    }
  }, [user])

  const fetchTopSubjects = async () => {
    try {
      if (!user) return

      // ✅ Fetch from localDB instead of API
      const [subjectsData, studentSubjectsData, studentsData] = await Promise.all([
        subjectActions.getAll(),
        studentSubjectActions.getAll(),
        studentActions.getAll(),
      ])

      // Filter by manager and status (exclude deleted items)
      const managerStudents = studentsData.filter(s => 
        s.managerId === user.id && s.status !== '0'
      )
      const activeSubjects = subjectsData.filter(s => s.status !== '0')
      const activeEnrollments = studentSubjectsData.filter(ss => 
        ss.status !== '0' && managerStudents.some(s => s.id === ss.studentId)
      )

      // Map subjects with enrollment counts
      const topSubjects = activeSubjects
        .map(subject => {
          const enrollments = activeEnrollments.filter(ss => ss.subjectId === subject.id)
          return {
            id: subject.id,
            name: subject.name,
            grade: subject.grade,
            students: enrollments.length,
            revenue: subject.price * enrollments.length,
            maxCapacity: 30 // Hardcoded as in API
          }
        })
        .filter(s => s.students > 0) // Filter subjects with students
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
        .slice(0, 5) // Take top 5

      setSubjects(topSubjects)

      // ✅ Old API call - commented out
      // const { data } = await axios.get('/api/dashboard/top-subjects')
      // setSubjects(data)
    } catch (err) {
      console.error('Failed to fetch top subjects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">{t('title')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground text-sm">
            {t('noData')}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {subjects.map((subject, index) => (
              <div key={subject.id} className="space-y-2">
                {/* Header: Rank, Name, Grade, Revenue */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge 
                      variant="outline" 
                      className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0 text-xs"
                    >
                      {index + 1}
                    </Badge>
                    <Link 
                      href={`/subjects/${subject.id}`}
                      className="font-medium hover:underline truncate text-sm sm:text-base"
                    >
                      {subject.name}
                    </Link>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {subject.grade}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 ml-8 sm:ml-0">
                    <span className="text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">
                      MAD {subject.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(subject.students / subject.maxCapacity) * 100} 
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {subject.students}/{subject.maxCapacity}
                  </span>
                </div>

                {/* Students Info */}
                <p className="text-xs text-muted-foreground">
                  {t('studentsEnrolled', { count: subject.students })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
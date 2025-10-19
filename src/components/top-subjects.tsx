'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

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

  useEffect(() => {
    fetchTopSubjects()
  }, [])

  const fetchTopSubjects = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/top-subjects')
      setSubjects(data)
    } catch (err) {
      console.error('Failed to fetch top subjects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <div className="space-y-6">
            {subjects.map((subject, index) => (
              <div key={subject.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <Link 
                      href={`/subjects/${subject.id}`}
                      className="font-medium hover:underline"
                    >
                      {subject.name}
                    </Link>
                    <Badge variant="secondary">{subject.grade}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600">
                      ${subject.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(subject.students / subject.maxCapacity) * 100} 
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {subject.students}/{subject.maxCapacity}
                  </span>
                </div>
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

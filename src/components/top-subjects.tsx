// components/dashboard/top-subjects.tsx
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp } from 'lucide-react'

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
        <CardTitle>Top Performing Subjects</CardTitle>
        <CardDescription>By enrollment and revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            No subjects available
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
                  {subject.students} students enrolled
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
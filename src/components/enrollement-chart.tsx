'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
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

  useEffect(() => {
    fetchEnrollmentData()
  }, [])

  const fetchEnrollmentData = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/enrollments')
      setData(data)
    } catch (err) {
      console.error('Failed to fetch enrollment data:', err)
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
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            {t('noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return `$${value.toFixed(2)}`
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

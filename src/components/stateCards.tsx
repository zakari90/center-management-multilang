'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import {
  DollarSign,
  GraduationCap,
  Loader2,
  Receipt,
  TrendingUp,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalStudents: number
  activeEnrollments: number
  totalTeachers: number
  totalSubjects: number
  monthlyRevenue: number
  revenueGrowth: number
  totalRevenue: number
  totalReceipts: number
}

export default function ManagerStatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations('ManagerStatsCards')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/stats')
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="flex items-center justify-center w-64 h-28"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statsData = [
    {
      title: t('studentstitle'),
      icon: Users,
      value: stats.totalStudents,
      subtitle: t('studentsactive', { count: stats.activeEnrollments }),
      colorClass: 'text-blue-600'
    },
    {
      title: t('teacherstitle'),
      icon: GraduationCap,
      value: stats.totalTeachers,
      subtitle: t('teacherssubtitle', { count: stats.totalSubjects }),
      colorClass: 'text-purple-600'
    },
    {
      title: t('monthlyRevenuetitle'),
      icon: DollarSign,
      value: `MAD ${stats.monthlyRevenue.toFixed(2)}`,
      subtitle: (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span>{t('monthlyRevenuegrowth', { percent: stats.revenueGrowth.toFixed(1) })}</span>
        </div>
      ),
      colorClass: 'text-green-600',
      isRevenue: true
    },
    {
      title: t('totalRevenuetitle'),
      icon: Receipt,
      value: `MAD ${stats.totalRevenue.toFixed(2)}`,
      subtitle: t('totalRevenuesubtitle', { count: stats.totalReceipts }),
      colorClass: 'text-orange-600',
      isRevenue: true
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="w-64 hover:shadow-md transition-shadow"
          >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">                
                {stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-bold ${stat.colorClass}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

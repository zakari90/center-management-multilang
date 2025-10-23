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

  // 🌀 Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="flex items-center justify-center h-24 sm:h-32 animate-pulse"
          >
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
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
      value: stats.monthlyRevenue,
      subtitle: (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
          <span className="truncate">
            {t('monthlyRevenuegrowth', {
              percent: stats.revenueGrowth.toFixed(1)
            })}
          </span>
        </div>
      ),
      colorClass: 'text-green-600',
      isRevenue: true
    },
    {
      title: t('totalRevenuetitle'),
      icon: Receipt,
      value: stats.totalRevenue,
      subtitle: t('totalRevenuesubtitle', { count: stats.totalReceipts }),
      colorClass: 'text-orange-600',
      isRevenue: true
    }
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-transform transition-shadow duration-200 min-w-[140px] sm:min-w-[180px]"
          >
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-sm sm:text-base font-medium line-clamp-2 pr-2">
                {stat.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>

            {/* Content */}
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div
                className={`text-2xl sm:text-3xl font-bold ${stat.colorClass} break-words`}
              >
                {stat.isRevenue ? (
                  <span className="block">
                    <span className="text-sm sm:text-lg">MAD</span>
                    <span className="ml-1">
                      {stat.value.toFixed(2)}
                    </span>
                  </span>
                ) : (
                  stat.value
                )}
              </div>

              <div className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {typeof stat.subtitle === 'string'
                  ? stat.subtitle
                  : stat.subtitle}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

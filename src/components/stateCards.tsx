'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import { DollarSign, GraduationCap, Loader2, Receipt, TrendingUp, Users } from 'lucide-react'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="min-h-[120px] md:min-h-[140px]">
            <CardContent className="flex justify-center items-center h-full py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {/* Students Card */}
      <Card className="min-h-[120px] md:min-h-[140px] transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-left flex-1 pr-2">
            {t('studentstitle')}
          </CardTitle>
          <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalStudents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('studentsactive', { count: stats.activeEnrollments.toLocaleString() })}
          </p>
        </CardContent>
      </Card>

      {/* Teachers Card */}
      <Card className="min-h-[120px] md:min-h-[140px] transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-left flex-1 pr-2">
            {t('teacherstitle')}
          </CardTitle>
          <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalTeachers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('teacherssubtitle', { count: stats.totalSubjects.toLocaleString() })}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Revenue Card */}
      <Card className="min-h-[120px] md:min-h-[140px] transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-left flex-1 pr-2">
            {t('monthlyRevenuetitle')}
          </CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
            {stats.monthlyRevenue.toLocaleString('ar-MA', { 
              style: 'currency', 
              currency: 'MAD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            })}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp 
              className={`mr-1 h-3 w-3 flex-shrink-0 ${
                stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            <span className={`${
              stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {t('monthlyRevenuegrowth', { percent: Math.abs(stats.revenueGrowth).toFixed(1) })}
              {stats.revenueGrowth < 0 && (
                <span className="ml-1">↓</span>
              )}
              {stats.revenueGrowth >= 0 && (
                <span className="ml-1">↑</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue Card */}
      <Card className="min-h-[120px] md:min-h-[140px] transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-left flex-1 pr-2">
            {t('totalRevenuetitle')}
          </CardTitle>
          <Receipt className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
            {stats.totalRevenue.toLocaleString('ar-MA', { 
              style: 'currency', 
              currency: 'MAD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('totalRevenuesubtitle', { count: stats.totalReceipts.toLocaleString() })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

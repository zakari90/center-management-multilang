'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import axios from 'axios' // ✅ Commented out - using localDB instead
import {
  DollarSign,
  GraduationCap,
  Receipt,
  TrendingUp,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { studentActions, teacherActions, subjectActions, receiptActions, studentSubjectActions } from '@/lib/dexie/dexieActions'
import { ReceiptType } from '@/lib/dexie/dbSchema'

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
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    setError(null)
    setIsLoading(true)
    try {
      if (!user) {
        setError('User not authenticated')
        return
      }

      // ✅ Fetch from localDB instead of API
      const [students, teachers, subjects, receipts, studentSubjects] = await Promise.all([
        studentActions.getAll(),
        teacherActions.getAll(),
        subjectActions.getAll(),
        receiptActions.getAll(),
        studentSubjectActions.getAll(),
      ])

      // Filter by manager and status (exclude deleted items)
      const managerStudents = students.filter(s => 
        s.managerId === user.id && s.status !== '0'
      )
      const managerTeachers = teachers.filter(t => 
        t.managerId === user.id && t.status !== '0'
      )
      const activeSubjects = subjects.filter(s => s.status !== '0')
      const managerReceipts = receipts.filter(r => 
        r.managerId === user.id && r.status !== '0'
      )
      const activeEnrollments = studentSubjects.filter(ss => 
        ss.status !== '0' && managerStudents.some(s => s.id === ss.studentId)
      )

      // Calculate date ranges
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      // Filter receipts by date
      const thisMonthReceipts = managerReceipts.filter(r => {
        const receiptDate = new Date(r.date)
        return receiptDate >= firstDayOfMonth && r.type === ReceiptType.STUDENT_PAYMENT
      })
      const lastMonthReceipts = managerReceipts.filter(r => {
        const receiptDate = new Date(r.date)
        return receiptDate >= firstDayOfLastMonth && 
               receiptDate <= lastDayOfLastMonth && 
               r.type === ReceiptType.STUDENT_PAYMENT
      })

      // Calculate revenue
      const monthlyRevenue = thisMonthReceipts.reduce((sum, r) => sum + r.amount, 0)
      const lastMonthRevenue = lastMonthReceipts.reduce((sum, r) => sum + r.amount, 0)
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0
      const totalRevenue = managerReceipts
        .filter(r => r.type === ReceiptType.STUDENT_PAYMENT)
        .reduce((sum, r) => sum + r.amount, 0)

      setStats({
        totalStudents: managerStudents.length,
        totalTeachers: managerTeachers.length,
        totalSubjects: activeSubjects.length,
        totalRevenue,
        monthlyRevenue,
        totalReceipts: managerReceipts.length,
        activeEnrollments: activeEnrollments.length,
        revenueGrowth
      })

      // ✅ Old API call - commented out
      // const { data } = await axios.get('/api/dashboard/stats')
      // setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setError('Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
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

    if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        {error}
      </div>
    )
  }
  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className='w-full'>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">                
                {stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-bold ${stat.colorClass}`}>
                {stat.value}
              </div>
              {/* <div className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </div> */}
            </CardContent>
          </Card>
        )
      })}
    </div>

  )
}

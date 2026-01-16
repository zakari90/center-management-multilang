// components/ReceiptsSummary.tsx
'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { receiptActions } from '@/lib/dexie/dexieActions'
import { ReceiptType } from '@/lib/dexie/dbSchema'
import AddStudentPaymentDialog from '@/components/AddStudentPaymentDialog'
import AddTeacherPaymentDialog from '@/components/AddTeacherPaymentDialog'

interface ReceiptStats {
  totalReceipts: number
  totalRevenue: number
  studentPayments: number
  teacherPayments: number
  thisMonthRevenue: number
}

export default function ReceiptsSummary() {
  const t = useTranslations('ManagerReceiptsSummary')
  const [stats, setStats] = useState<ReceiptStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      if (!user) return

      // ✅ Fetch from localDB instead of API
      const receipts = await receiptActions.getAll()

      // Filter by status only (exclude deleted items) - all users see all data
      const activeReceipts = receipts.filter(r => r.status !== '0')

      // Calculate date range for this month
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Calculate stats
      const stats = activeReceipts.reduce((acc, receipt) => {
        acc.totalReceipts++
        acc.totalRevenue += receipt.amount

        if (receipt.type === ReceiptType.STUDENT_PAYMENT) {
          acc.studentPayments += receipt.amount
        } else if (receipt.type === ReceiptType.TEACHER_PAYMENT) {
          acc.teacherPayments += receipt.amount
        }

        if (new Date(receipt.date) >= firstDayOfMonth) {
          acc.thisMonthRevenue += receipt.amount
        }

        return acc
      }, {
        totalReceipts: 0,
        totalRevenue: 0,
        studentPayments: 0,
        teacherPayments: 0,
        thisMonthRevenue: 0
      })

      setStats(stats)

      // ✅ Old API call - commented out
      // const response = await fetch('/api/receipts/stats')
      // if (response.ok) {
      //   const data = await response.json()
      //   setStats(data)
      // }
    } catch (err) {
      console.error(t('errorFetchStats'), err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card className="shadow-sm border border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          {t('financialOverview')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label={t('totalRevenue')} value={stats.totalRevenue} color="text-green-600" />
          <Stat label={t('thisMonth')} value={stats.thisMonthRevenue} color="text-blue-600" />
          <Stat label={t('income')} value={stats.studentPayments} color="text-green-600" />
          <Stat label={t('expenses')} value={stats.teacherPayments} color="text-orange-600" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-row gap-1 border-t pt-2">
        <AddStudentPaymentDialog onPaymentCreated={fetchStats} />
        <AddTeacherPaymentDialog onPaymentCreated={fetchStats} />
      </CardFooter>
    </Card>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>MAD {value.toFixed(2)}</p>
    </div>
  )
}

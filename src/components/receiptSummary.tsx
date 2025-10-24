// components/ReceiptsSummary.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/receipts/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
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

      <CardFooter className="flex flex-col md:flex-row gap-3 border-t pt-4">
        <Button asChild className="flex-1 bg-primary hover:bg-primary-foreground">
          <Link href="/manager/receipts/create">{t('studentPayment')}</Link>
        </Button>
        <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700">
          <Link href="/manager/receipts/create-teacher-payment">{t('teacherPayment')}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>${value.toFixed(2)}</p>
    </div>
  )
}

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import axios from 'axios' // ✅ Commented out - using localDB instead
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/context/authContext'
import { receiptActions } from '@/lib/dexie/dexieActions'
import { ReceiptType } from '@/lib/dexie/dbSchema'
import { eachDayOfInterval, eachMonthOfInterval, format, startOfYear, subDays } from 'date-fns'

interface RevenueData {
  date: string
  income: number
  expense: number
  net: number
}

export default function ManagerRevenueChart() {
  const [data, setData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const t = useTranslations('ManagerRevenueChart')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchRevenueData()
    }
  }, [period, user])

  const fetchRevenueData = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      // ✅ Fetch from localDB instead of API
      const receipts = await receiptActions.getAll()

      // Filter by manager and status (exclude deleted items)
      const managerReceipts = receipts.filter(r => 
        r.managerId === user.id && r.status !== '0'
      )

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date
      let dateFormat: string
      let intervals: Date[]

      switch (period) {
        case 'week':
          startDate = subDays(now, 7)
          dateFormat = 'MMM dd'
          intervals = eachDayOfInterval({ start: startDate, end: now })
          break
        case 'year':
          startDate = startOfYear(now)
          dateFormat = 'MMM'
          intervals = eachMonthOfInterval({ start: startDate, end: now })
          break
        case 'month':
        default:
          startDate = subDays(now, 30)
          dateFormat = 'MMM dd'
          intervals = eachDayOfInterval({ start: startDate, end: now })
          break
      }

      // Filter receipts by date range
      const filteredReceipts = managerReceipts.filter(r => {
        const receiptDate = new Date(r.date)
        return receiptDate >= startDate
      })

      // Group receipts by date
      const revenueMap = new Map<string, { income: number; expense: number }>()

      intervals.forEach(date => {
        const key = format(date, dateFormat)
        revenueMap.set(key, { income: 0, expense: 0 })
      })

      filteredReceipts.forEach(receipt => {
        const key = format(new Date(receipt.date), dateFormat)
        const existing = revenueMap.get(key) || { income: 0, expense: 0 }

        if (receipt.type === ReceiptType.STUDENT_PAYMENT) {
          existing.income += receipt.amount
        } else if (receipt.type === ReceiptType.TEACHER_PAYMENT) {
          existing.expense += receipt.amount
        }

        revenueMap.set(key, existing)
      })

      const chartData = Array.from(revenueMap.entries()).map(([date, values]) => ({
        date,
        income: values.income,
        expense: values.expense,
        net: values.income - values.expense
      }))

      setData(chartData)

      // ✅ Old API call - commented out
      // const { data } = await axios.get(`/api/dashboard/revenue?period=${period}`)
      // setData(data)
    } catch (err) {
      console.error('Failed to fetch revenue data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">{t('tabs.week')}</TabsTrigger>
              <TabsTrigger value="month">{t('tabs.month')}</TabsTrigger>
              <TabsTrigger value="year">{t('tabs.year')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `MAD ${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                name={t('chart.income')}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorExpense)" 
                name={t('chart.expense')}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

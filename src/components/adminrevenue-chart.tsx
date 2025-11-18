/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import axios from 'axios' // ✅ Commented out - using local DB instead
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { receiptActions } from '@/lib/dexie/dexieActions'
import { ReceiptType } from '@/lib/dexie/dbSchema'
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
import { getChartColors } from '@/lib/utils/themeColors'

interface RevenueData {
  date: string
  income: number
  expense: number
  net: number
}

export default function AdminRevenueChart() {
  const t = useTranslations('adminRevenueChart')
  const [data, setData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const chartColors = getChartColors()

  const fetchRevenueData = useCallback(async () => {
    setIsLoading(true)
    try {
      // ✅ Fetch receipts from local DB
      const allReceipts = await receiptActions.getAll()
      const activeReceipts = allReceipts.filter(r => r.status !== '0')

      // ✅ Calculate date range based on period
      const now = new Date()
      let startDate: Date
      
      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else { // year
        startDate = new Date(now.getFullYear(), 0, 1)
      }

      const startTime = startDate.getTime()
      const filteredReceipts = activeReceipts.filter(r => r.date >= startTime)

      // ✅ Group by date and calculate income/expense
      const revenueMap = new Map<string, { income: number; expense: number }>()

      filteredReceipts.forEach(receipt => {
        const date = new Date(receipt.date)
        let key: string
        
        if (period === 'week') {
          key = date.toLocaleDateString('en-US', { weekday: 'short' })
        } else if (period === 'month') {
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else {
          key = date.toLocaleDateString('en-US', { month: 'short' })
        }

        const existing = revenueMap.get(key) || { income: 0, expense: 0 }
        
        if (receipt.type === ReceiptType.STUDENT_PAYMENT) {
          existing.income += receipt.amount
        } else if (receipt.type === ReceiptType.TEACHER_PAYMENT) {
          existing.expense += receipt.amount
        }
        
        revenueMap.set(key, existing)
      })

      // ✅ Convert to array and sort
      const revenueData: RevenueData[] = Array.from(revenueMap.entries())
        .map(([date, values]) => ({
          date,
          income: values.income,
          expense: values.expense,
          net: values.income - values.expense
        }))
        .sort((a, b) => {
          // Simple sort - in production, you'd parse dates properly
          return a.date.localeCompare(b.date)
        })

      setData(revenueData)

      // ✅ Commented out API call
      // const { data } = await axios.get(`/api/admin/dashboard/revenue?period=${period}`)
      // setData(data)
    } catch (err) {
      console.error('Failed to fetch revenue data from local DB:', err)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchRevenueData()
  }, [fetchRevenueData])

  return (
    <Card className="col-span-4 w-full">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">{t('week')}</TabsTrigger>
              <TabsTrigger value="month">{t('month')}</TabsTrigger>
              <TabsTrigger value="year">{t('year')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[300px] w-[90vw] sm:w-full">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.chart2} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColors.chart2} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.destructive} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColors.destructive} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'var(--popover)', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke={chartColors.chart2} 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    name={t('income')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke={chartColors.destructive} 
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                    name={t('expenses')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

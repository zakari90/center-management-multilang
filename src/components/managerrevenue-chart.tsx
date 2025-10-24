/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import axios from 'axios'
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

  useEffect(() => {
    fetchRevenueData()
  }, [period])

  const fetchRevenueData = async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get(`/api/dashboard/revenue?period=${period}`)
      setData(data)
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
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

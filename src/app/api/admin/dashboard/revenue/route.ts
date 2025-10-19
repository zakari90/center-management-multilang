// app/api/dashboard/revenue/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { eachDayOfInterval, eachMonthOfInterval, format, startOfYear, subDays } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'

    let startDate: Date
    let dateFormat: string
    let intervals: Date[]

    const now = new Date()

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

    const receipts = await db.receipt.findMany({
      where: {
        date: {
          gte: startDate
        }
      },
      select: {
        amount: true,
        type: true,
        date: true
      }
    })

    // Group receipts by date
    const revenueMap = new Map<string, { income: number; expense: number }>()

    intervals.forEach(date => {
      const key = format(date, dateFormat)
      revenueMap.set(key, { income: 0, expense: 0 })
    })

    receipts.forEach(receipt => {
      const key = format(new Date(receipt.date), dateFormat)
      const existing = revenueMap.get(key) || { income: 0, expense: 0 }

      if (receipt.type === 'STUDENT_PAYMENT') {
        existing.income += receipt.amount
      } else {
        existing.expense += receipt.amount
      }

      revenueMap.set(key, existing)
    })

    const data = Array.from(revenueMap.entries()).map(([date, values]) => ({
      date,
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
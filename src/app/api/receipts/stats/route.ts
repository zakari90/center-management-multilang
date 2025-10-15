// app/api/receipts/stats/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receipts = await db.receipt.findMany({
      where: {
        managerId: session.user.id
      },
      select: {
        amount: true,
        type: true,
        date: true
      }
    })

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats = receipts.reduce((acc, receipt) => {
      acc.totalReceipts++
      acc.totalRevenue += receipt.amount

      if (receipt.type === 'STUDENT_PAYMENT') {
        acc.studentPayments += receipt.amount
      } else {
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

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching receipt stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
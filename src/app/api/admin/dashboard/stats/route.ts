/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/dashboard/stats/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session :any = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
//add where session.user.id === session.user.id
    const [centers, managers, students, teachers, receipts] = await Promise.all([
      db.center.count(),
      db.user.count({ where: { role: 'MANAGER' } }),
      db.student.count(),
      db.teacher.count(),
      db.receipt.findMany({
        where: { type: 'STUDENT_PAYMENT' },
        select: { amount: true, date: true }
      })
    ])

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthRevenue = receipts
      .filter(r => new Date(r.date) >= firstDayOfMonth)
      .reduce((sum, r) => sum + r.amount, 0)

    const lastMonthRevenue = receipts
      .filter(r => new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth)
      .reduce((sum, r) => sum + r.amount, 0)

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0

    const totalRevenue = receipts.reduce((sum, r) => sum + r.amount, 0)

    return NextResponse.json({
      totalCenters: centers,
      totalManagers: managers,
      totalStudents: students,
      totalTeachers: teachers,
      totalRevenue,
      monthlyRevenue: thisMonthRevenue,
      revenueGrowth
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
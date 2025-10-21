/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/dashboard/stats/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session:any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [students, teachers, subjects, receipts, enrollments] = await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.subject.count(),
      db.receipt.findMany({
        where: { managerId: session.user.id },
        select: { amount: true, type: true, date: true }
      }),
      db.studentSubject.count()
    ])

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthReceipts = receipts.filter((r:any) => new Date(r.date) >= firstDayOfMonth)
    const lastMonthReceipts = receipts.filter((r:any) => 
      new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth
    )

    const monthlyRevenue = thisMonthReceipts
      .filter((r:any) => r.type === 'STUDENT_PAYMENT')
      .reduce((sum:any, r:any) => sum + r.amount, 0)

    const lastMonthRevenue = lastMonthReceipts
      .filter((r:any) => r.type === 'STUDENT_PAYMENT')
      .reduce((sum:any, r:any) => sum + r.amount, 0)

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0

    const totalRevenue = receipts
      .filter((r:any) => r.type === 'STUDENT_PAYMENT')
      .reduce((sum:any, r:any) => sum + r.amount, 0)

    return NextResponse.json({
      totalStudents: students,
      totalTeachers: teachers,
      totalSubjects: subjects,
      totalRevenue,
      monthlyRevenue,
      totalReceipts: receipts.length,
      activeEnrollments: enrollments,
      revenueGrowth
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
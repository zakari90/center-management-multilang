/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/dashboard/activities/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session:any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent students
    const recentStudents = await db.student.findMany({
      where: { managerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, name: true, createdAt: true }
    })

    // Get recent teachers
    const recentTeachers = await db.teacher.findMany({
      where: { managerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, name: true, createdAt: true }
    })

    // Get recent enrollments
    const recentEnrollments = await db.studentSubject.findMany({
      where: {
        student: { managerId: session.user.id }
      },
      orderBy: { enrolledAt: 'desc' },
      take: 3,
      include: {
        student: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } }
      }
    })

    // Get recent payments
    const recentPayments = await db.receipt.findMany({
      where: {
        managerId: session.user.id,
        type: 'STUDENT_PAYMENT'
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        student: { select: { id: true, name: true } }
      }
    })

    const activities = [
      ...recentStudents.map(s => ({
        id: `student-${s.id}`,
        type: 'student' as const,
        title: 'New Student',
        description: `${s.name} was enrolled`,
        date: s.createdAt.toISOString(),
        link: `/students/${s.id}`
      })),
      ...recentTeachers.map(t => ({
        id: `teacher-${t.id}`,
        type: 'teacher' as const,
        title: 'New Teacher',
        description: `${t.name} joined the team`,
        date: t.createdAt.toISOString(),
        link: `/teachers/${t.id}`
      })),
      ...recentEnrollments.map(e => ({
        id: `enrollment-${e.id}`,
        type: 'enrollment' as const,
        title: 'New Enrollment',
        description: `${e.student.name} enrolled in ${e.subject.name}`,
        date: e.enrolledAt.toISOString(),
        link: `/students/${e.student.id}`
      })),
      ...recentPayments.map(p => ({
        id: `payment-${p.id}`,
        type: 'payment' as const,
        title: 'Payment Received',
        description: `Payment from ${p.student?.name || 'Student'}`,
        date: p.createdAt.toISOString(),
        link: `/receipts/${p.id}`,
        amount: p.amount
      }))
    ]

    // Sort by date and limit to 10
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return NextResponse.json(activities.slice(0, 10))
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
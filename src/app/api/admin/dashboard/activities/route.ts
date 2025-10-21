/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/dashboard/activities/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session:any  = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [recentCenters, recentManagers, recentStudents, recentPayments] = await Promise.all([
      db.center.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true }
      }),
      db.user.findMany({
        where: { role: 'MANAGER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true }
      }),
      db.student.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true }
      }),
      db.receipt.findMany({
        where: { type: 'STUDENT_PAYMENT' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, createdAt: true }
      })
    ])

    const activities = [
      ...recentCenters.map((c:any)=> ({
        id: `center-${c.id}`,
        type: 'center_created' as const,
        description: `New center "${c.name}" created`,
        centerName: c.name,
        timestamp: c.createdAt.toISOString()
      })),
      ...recentManagers.map((m:any )=> ({
        id: `manager-${m.id}`,
        type: 'manager_added' as const,
        description: `Manager ${m.name} added to system`,
        timestamp: m.createdAt.toISOString()
      })),
      ...recentStudents.map((s:any) => ({
        id: `student-${s.id}`,
        type: 'student_enrolled' as const,
        description: `Student ${s.name} enrolled`,
        timestamp: s.createdAt.toISOString()
      })),
      ...recentPayments.map((p:any )=> ({
        id: `payment-${p.id}`,
        type: 'payment_received' as const,
        description: 'Payment received',
        amount: p.amount,
        timestamp: p.createdAt.toISOString()
      }))
    ]

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return NextResponse.json(activities.slice(0, 15))
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
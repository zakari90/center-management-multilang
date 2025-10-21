/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/dashboard/performance/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session :any = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const centers = await db.center.findMany({
      select: {
        id: true,
        name: true
      }
    })

    const performance = await Promise.all(
      centers.map(async (center:any) => {
        // Get students, teachers, and revenue per center
        // Note: Adjust these queries based on your actual schema relationships
        const [students, teachers, receipts] = await Promise.all([
          db.student.count(),
          db.teacher.count(),
          db.receipt.findMany({
            where: { type: 'STUDENT_PAYMENT' },
            select: { amount: true }
          })
        ])

        const revenue = receipts.reduce((sum :any, r :any) => sum + r.amount, 0)

        return {
          center: center.name.length > 15 ? center.name.substring(0, 15) + '...' : center.name,
          students,
          teachers,
          revenue
        }
      })
    )

    return NextResponse.json(performance)
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
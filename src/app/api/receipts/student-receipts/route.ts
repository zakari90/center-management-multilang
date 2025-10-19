/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/receipts/student-receipts/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session :any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receipts = await db.receipt.findMany({
      where: {
        managerId: session.user.id,
        type: 'STUDENT_PAYMENT'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching student receipts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
// app/api/receipts/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let receipts
if (session.user.role === 'MANAGER' ) {
   receipts = await db.receipt.findMany({
      where: {
        managerId: session.user.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })
}

   receipts = await db.receipt.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true
          }
        },
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      studentId, 
      teacherId, 
      amount, 
      type, 
      paymentMethod, 
      description, 
      date 
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (type === 'STUDENT_PAYMENT' && !studentId) {
      return NextResponse.json({ error: 'Student ID required for student payment' }, { status: 400 })
    }

    if (type === 'TEACHER_PAYMENT' && !teacherId) {
      return NextResponse.json({ error: 'Teacher ID required for teacher payment' }, { status: 400 })
    }

    const receipt = await db.receipt.create({
      data: {
        amount: parseFloat(amount),
        type,
        paymentMethod: paymentMethod || null,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        studentId: type === 'STUDENT_PAYMENT' ? studentId : null,
        teacherId: type === 'TEACHER_PAYMENT' ? teacherId : null,
        managerId: session.user.id,
      },
      include: {
        student: true,
        teacher: true
      }
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
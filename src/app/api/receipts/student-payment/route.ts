/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/receipts/student-payment/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(req: NextRequest) {
  try {
    const session :any = await getSession() // Assu
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, subjectIds, paymentMethod, description, date } = body

    if (!studentId || !subjectIds || subjectIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const studentSubjects = await db.studentSubject.findMany({
      where: {
        studentId,
        subjectId: { in: subjectIds },
        student: {
          managerId: session.user.id
        }
      },
      include: {
        subject: true
      }
    })

    if (studentSubjects.length === 0) {
      return NextResponse.json({ error: 'No valid subjects found' }, { status: 404 })
    }

    // Calculate total amount
    const totalAmount = studentSubjects.reduce((sum:any, ss:any) => sum + ss.subject.price, 0)

    // Create description if not provided
    const subjectNames = studentSubjects.map((ss:any) => ss.subject.name).join(', ')
    const finalDescription = description || `Payment for: ${subjectNames}`

    // Create receipt
    const receipt = await db.receipt.create({
      data: {
        receiptNumber: `RCP-${Date.now()}`,
        amount: totalAmount,
        type: 'STUDENT_PAYMENT',
        paymentMethod: paymentMethod || null,
        description: finalDescription,
        date: date ? new Date(date) : new Date(),
        studentId,
        managerId: session.user.id,
      },
      include: {
        student: true
      }
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Error creating student payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
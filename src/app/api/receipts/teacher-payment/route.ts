/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/receipts/teacher-payment/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(req: NextRequest) {
  try {
    const session:any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { teacherId, subjectIds, paymentMethod, description, date } = body

    if (!teacherId || !subjectIds || subjectIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Get teacher subjects with enrolled students
    const teacherSubjects = await db.teacherSubject.findMany({
      where: {
        teacherId,
        subjectId: { in: subjectIds },
        teacher: {
          managerId: session.user.id
        }
      },
      include: {
        subject: {
          include: {
            studentSubjects: {
              where: {
                teacherId // Only count students assigned to this teacher
              }
            }
          }
        }
      }
    })

    if (teacherSubjects.length === 0) {
      return NextResponse.json({ error: 'No valid subjects found' }, { status: 404 })
    }

    // Calculate total amount
    let totalAmount = 0
    const subjectDetails: string[] = []

    for (const ts of teacherSubjects) {
      const enrolledStudents = ts.subject.studentSubjects.length
      let subjectAmount = 0

      if (ts.percentage) {
        subjectAmount = (ts.subject.price * ts.percentage / 100) * enrolledStudents
      } else if (ts.hourlyRate) {
        subjectAmount = ts.hourlyRate * enrolledStudents
      }

      totalAmount += subjectAmount
      subjectDetails.push(
        `${ts.subject.name} (${enrolledStudents} students): $${subjectAmount.toFixed(2)}`
      )
    }

    // Create description if not provided
    const finalDescription = description || `Payment for: ${subjectDetails.join(', ')}`

    // Create receipt
    const receipt = await db.receipt.create({
      data: {
        amount: totalAmount,
        type: 'TEACHER_PAYMENT',
        paymentMethod: paymentMethod || null,
        description: finalDescription,
        date: date ? new Date(date) : new Date(),
        teacherId,
        managerId: session.user.id,
      },
      include: {
        teacher: true
      }
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
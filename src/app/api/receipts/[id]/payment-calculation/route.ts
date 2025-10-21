/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const session: any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await db.teacher.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      },
      include: {
        teacherSubjects: {
          include: {
            subject: {
              include: {
                studentSubjects: {
                  where: {
                    teacherId: id
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const subjects = teacher.teacherSubjects.map((ts:any) => {
      const enrolledStudents = ts.subject.studentSubjects.length
      
      let calculatedAmount = 0
      if (ts.percentage) {
        calculatedAmount = (ts.subject.price * ts.percentage / 100) * enrolledStudents
      } else if (ts.hourlyRate) {
        calculatedAmount = ts.hourlyRate * enrolledStudents
      }

      return {
        subjectId: ts.subject.id,
        subjectName: ts.subject.name,
        grade: ts.subject.grade,
        price: ts.subject.price,
        percentage: ts.percentage,
        hourlyRate: ts.hourlyRate,
        enrolledStudents,
        calculatedAmount
      }
    })

    const totalAmount = subjects.reduce((sum:any, s:any) => sum + s.calculatedAmount, 0)

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      },
      subjects,
      totalAmount
    })
  } catch (error) {
    console.error('Error calculating teacher payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
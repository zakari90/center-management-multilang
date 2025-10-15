import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const { id } = await params

    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher with their subjects and enrolled students
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
                    teacherId: id // Only count students assigned to this teacher
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

    // Calculate payment for each subject
    const subjects = teacher.teacherSubjects.map(ts => {
      const enrolledStudents = ts.subject.studentSubjects.length
      
      let calculatedAmount = 0
      if (ts.percentage) {
        // Formula: subject price × percentage × number of enrolled students
        calculatedAmount = (ts.subject.price * ts.percentage / 100) * enrolledStudents
      } else if (ts.hourlyRate) {
        // For hourly rate, we'd need hours worked - for now just multiply by students as placeholder
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

    const totalAmount = subjects.reduce((sum, s) => sum + s.calculatedAmount, 0)

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
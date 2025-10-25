/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/students/[id]/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const id = (await params).id

    // Public endpoint - no auth required
    // But you can add optional auth if needed
    const student = await db.student.findUnique({
      where: { id },
      include: {
        studentSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                grade: true,
                price: true
              }
            },
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Optionally hide sensitive data for public view
    return NextResponse.json({
      id: student.id,
      name: student.name,
      grade: student.grade,
      email: student.email,
      phone: student.phone,
      studentSubjects: student.studentSubjects,
      createdAt: student.createdAt
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const id = (await params).id
    const session: any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await db.student.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    await db.student.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const id = (await params).id
    const session: any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      name, 
      email, 
      phone, 
      parentName, 
      parentPhone, 
      parentEmail, 
      grade,
      enrollments  // ← Changed from 'subjects'
    } = body

    const existingStudent = await db.student.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (email && email !== existingStudent.email) {
      const emailInUse = await db.student.findUnique({
        where: { email }
      })
      
      if (emailInUse) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    const student = await db.$transaction(async (tx: any) => {
      await tx.student.update({
        where: { id },
        data: {
          name: name || existingStudent.name,
          email: email !== undefined ? email : existingStudent.email,
          phone: phone !== undefined ? phone : existingStudent.phone,
          parentName: parentName !== undefined ? parentName : existingStudent.parentName,
          parentPhone: parentPhone !== undefined ? parentPhone : existingStudent.parentPhone,
          parentEmail: parentEmail !== undefined ? parentEmail : existingStudent.parentEmail,
          grade: grade !== undefined ? grade : existingStudent.grade,
        }
      })

      // Update enrollments if provided
      if (enrollments) {
        // Delete existing enrollments
        await tx.studentSubject.deleteMany({
          where: { studentId: id }
        })

        // Create new enrollments with teachers
        if (enrollments.length > 0) {
          await tx.studentSubject.createMany({
            data: enrollments.map((enrollment: { subjectId: string; teacherId: string }) => ({
              studentId: id,
              subjectId: enrollment.subjectId,
              teacherId: enrollment.teacherId,  // ← Added teacherId
            }))
          })
        }
      }

      return tx.student.findUnique({
        where: { id },
        include: {
          studentSubjects: {
            include: {
              subject: true,
              teacher: true  // ← Include teacher info
            }
          }
        }
      })
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

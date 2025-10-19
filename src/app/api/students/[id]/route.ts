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
    const session: any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await db.student.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      },
      include: {
        studentSubjects: {
          include: {
            subject: true,
            teacher: true,
          }
        },
        receipts: {
          orderBy: {
            date: 'desc'
          },
          take: 10
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student)
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
      subjects 
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

    const student = await db.$transaction(async (tx) => {
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

      if (subjects) {
        await tx.studentSubject.deleteMany({
          where: { studentId: id }
        })

        if (subjects.length > 0) {
          await tx.studentSubject.createMany({
            data: subjects.map((subjectId: string) => ({
              studentId: id,
              subjectId: subjectId,
            }))
          })
        }
      }

      return tx.student.findUnique({
        where: { id },
        include: {
          studentSubjects: {
            include: {
              subject: true
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
// app/api/students/[id]/route.ts
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

    const student = await db.student.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      },
      include: {
        studentSubjects: {
          include: {
            subject: true,
            teacher:true,
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify student belongs to this manager
    const student = await db.student.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete student (cascade will handle related records)
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
  { params }: { params: { id: string } }
) {
 
  
  try {
    const id = await params.id
    const session = await getSession()
    
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

    // Verify student belongs to this manager
    const existingStudent = await db.student.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingStudent.email) {
      const emailInUse = await db.student.findUnique({
        where: { email }
      })
      
      if (emailInUse) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Update student in transaction
    const student = await db.$transaction(async (tx) => {
      // Update basic info
      const updated = await tx.student.update({
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

      // Update subjects if provided
      if (subjects) {
        // Delete existing subjects
        await tx.studentSubject.deleteMany({
          where: { studentId: id}
        })

        // Create new subjects
        if (subjects.length > 0) {
          await tx.studentSubject.createMany({
            data: subjects.map((subjectId: string) => ({
              studentId: params.id,
              subjectId: subjectId,
            }))
          })
        }
      }

      return tx.student.findUnique({
        where: { id},
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
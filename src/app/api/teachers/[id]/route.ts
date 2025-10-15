import { getSession } from "@/lib/authentication"
import db from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
        const { id } = await params

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
            subject: true
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

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error fetching teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id } = await params
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify teacher belongs to this manager
    const teacher = await db.teacher.findUnique({
      where: { 
        id,
        managerId: session.user.id 
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Delete teacher (cascade will handle related records)
    await db.teacher.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
        const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, address, weeklySchedule, subjects } = body

    // Verify teacher belongs to this manager
    const existingTeacher = await db.teacher.findUnique({
      where: { 
        id: id,
        managerId: session.user.id 
      }
    })

    if (!existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Update teacher in transaction
    const teacher = await db.$transaction(async (tx) => {
      // Update basic info
      const updated = await tx.teacher.update({
        where: { id: id },
        data: {
          name: name || existingTeacher.name,
          email: email !== undefined ? email : existingTeacher.email,
          phone: phone !== undefined ? phone : existingTeacher.phone,
          address: address !== undefined ? address : existingTeacher.address,
          weeklySchedule: weeklySchedule !== undefined ? weeklySchedule : existingTeacher.weeklySchedule,
        }
      })

      // Update subjects if provided
      if (subjects) {
        // Delete existing subjects
        await tx.teacherSubject.deleteMany({
          where: { teacherId: id }
        })

        // Create new subjects
        if (subjects.length > 0) {
          await tx.teacherSubject.createMany({
            data: subjects.map((subject: any) => ({
              teacherId: id,
              subjectId: subject.subjectId,
              percentage: subject.percentage,
              hourlyRate: subject.hourlyRate,
            }))
          })
        }
      }

      return tx.teacher.findUnique({
        where: { id: id },
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      })
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
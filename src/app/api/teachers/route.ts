/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/authentication";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {  
  try {
    const session :any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, phone, address, weeklySchedule, subjects } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if email already exists
    if (email) {
      const existingTeacher = await db.teacher.findUnique({
        where: { email }
      })
      
      if (existingTeacher) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Create teacher with subjects in a transaction
    const teacher = await db.$transaction(async (tx) => {
      // Create the teacher
      const newTeacher = await tx.teacher.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          weeklySchedule: weeklySchedule || null,
          managerId: session.user.id,
        },
      })

      // Create teacher-subject associations if subjects provided
      if (subjects && subjects.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjects.map((subject: any) => ({
            teacherId: newTeacher.id,
            subjectId: subject.subjectId,
            percentage: subject.percentage,
            hourlyRate: subject.hourlyRate,
          }))
        })
      }

      // Return teacher with subjects
      return tx.teacher.findUnique({
        where: { id: newTeacher.id },
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      })
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
export async function GET() {
  try {
    
    const session :any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teachers managed by this user
    const teachers = await db.teacher.findMany({
      where: {
        managerId: session.user.id
      },
      include: {
        teacherSubjects: {
          include: {
            subject: true
          }
        },
        _count: {
          select: {
            receipts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth"
import db from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const includeTeachers = searchParams.get('includeTeachers') === 'true'

    const subjects = await db.subject.findMany({
      include: includeTeachers ? {
        teacherSubjects: {
          include: {
            teacher: true 
          }
        }
      } : undefined,
      orderBy: [
        { grade: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log('Subjects with teachers:', JSON.stringify(subjects, null, 2)) // Debug log

    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
export async function POST(request: Request) {
  try {
        const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, centerId, name, grade, price, duration, createdAt, updatedAt } = body

    if (!centerId) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      )
    }

    if (id) {
      const existingSubject = await db.subject.findUnique({
        where: { id },
      })

      if (existingSubject) {
        const updatedSubject = await db.subject.update({
          where: { id },
          data: {
            name,
            grade,
            price,
            duration,
            centerId,
            ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
          },
        })
        return NextResponse.json(updatedSubject)
      }
    }

    const subject = await db.subject.create({
      data: {
        id: id || undefined,
        name,
        grade,
        price,
        duration,
        centerId,
        ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
        ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
      }
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.log(error);

    // Duplicate key (e.g. subject with this id already exists)
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subject with this ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create subject',
        details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
        const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subjectId, ...updateData } = body

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    const subject = await db.subject.update({
      where: { id: subjectId },
      data: updateData
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.log(error);
    
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
        const session:any = await getSession()
    
    if (!(session?.user?.role === "ADMIN")) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subjectId } = body

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    await db.subject.delete({
      where: { id: subjectId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error);
    
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}
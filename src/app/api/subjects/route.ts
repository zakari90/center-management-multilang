import { getSession } from "@/lib/authentication"
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
    const { centerId, name, grade, price, duration } = body

    if (!centerId) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      )
    }

    const subject = await db.subject.create({
      data: {
        name,
        grade,
        price,
        duration,
        centerId
      }
    })

    return NextResponse.json(subject)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create subject' },
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
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
        const session = await getSession()
    
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
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}
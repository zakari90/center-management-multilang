import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { day, startTime, endTime, teacherId, subjectId, roomId, centerId } = body

    // Validation
    if (!day || !startTime || !endTime || !teacherId || !subjectId || !roomId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for conflicts - same teacher, same time
    const teacherConflict = await db.schedule.findFirst({
      where: {
        teacherId,
        day,
        startTime,
      }
    })

    if (teacherConflict) {
      return NextResponse.json({ 
        error: 'Teacher already has a class at this time' 
      }, { status: 409 })
    }

    // Check for room conflicts
    const roomConflict = await db.schedule.findFirst({
      where: {
        roomId,
        day,
        startTime,
        centerId: centerId || null
      }
    })

    if (roomConflict) {
      return NextResponse.json({ 
        error: 'Room is already booked at this time' 
      }, { status: 409 })
    }

    // Create schedule
    const schedule = await db.schedule.create({
      data: {
        day,
        startTime,
        endTime,
        roomId,
        teacherId,
        subjectId,
        managerId: session.user.id,
        centerId: centerId || null
      },
      include: {
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, grade: true } }
      }
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Schedule creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // const { searchParams } = new URL(req.url)
  // const centerId = searchParams.get('centerId')

  const schedules = await db.schedule.findMany({
    // where: {
      
    //   managerId: session.user.id,
    //   ...(centerId && { centerId })
    // }, 
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          weeklySchedule: true
        }
      },
      subject: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      }
    },
    orderBy: [
      { day: 'asc' },
      { startTime: 'asc' }
    ]
  })

  console.log(schedules);
    console.log("8888---------------------------------------------------------------");


  return NextResponse.json(schedules)
}
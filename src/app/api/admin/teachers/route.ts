/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session :any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teachers = await db.teacher.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        weeklySchedule: true,
        manager: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            teacherSubjects: true,
            studentSubjects: true,
            receipts: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log(teachers);
    

    const transformedTeachers = teachers.map((teacher:any) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      weeklySchedule:teacher.weeklySchedule,
      createdAt: teacher.createdAt.toISOString(),
      manager: teacher.manager,
      stats: {
        subjects: teacher._count.teacherSubjects,
        students: teacher._count.studentSubjects,
        receipts: teacher._count.receipts,
      }
    }))

    return NextResponse.json(transformedTeachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teachers' }, 
      { status: 500 }
    )
  }
}
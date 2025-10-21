/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/dashboard/top-subjects/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session:any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subjects = await db.subject.findMany({
      include: {
        studentSubjects: true
      }
    })

    const topSubjects = subjects
      .map((subject:any) => ({
        id: subject.id,
        name: subject.name,
        grade: subject.grade,
        students: subject.studentSubjects.length,
        revenue: subject.price * subject.studentSubjects.length,
        maxCapacity: 30 // You can make this dynamic
      }))
      .filter((s:any) => s.students > 0)
      .sort((a:any, b:any) => b.revenue - a.revenue)
      .slice(0, 5)

    return NextResponse.json(topSubjects)
  } catch (error) {
    console.error('Error fetching top subjects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
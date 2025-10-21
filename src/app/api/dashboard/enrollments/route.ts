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

    const enrollments = await db.studentSubject.groupBy({
      by: ['subjectId'],
      _count: {
        studentId: true // Avoid ambiguous 'id' field
      }
    })

    const subjectsData = await db.subject.findMany({
      where: {
        id: {
          in: enrollments.map((e:any) => e.subjectId)
        }
      },
      select: {
        id: true,
        name: true,
        price: true
      }
    })

    // Merge the enrollments and subject data
    const data = enrollments.map((enrollment:any) => {
      const subject = subjectsData.find((s:any) => s.id === enrollment.subjectId)
      return {
        subject: subject?.name || 'Unknown',
        students: enrollment._count.studentId,
        revenue: (subject?.price || 0) * enrollment._count.studentId
      }
    })
    .sort((a:any, b:any) => b.students - a.students) // Sort by most students
    .slice(0, 6) // Take top 6 subjects

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching enrollment data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

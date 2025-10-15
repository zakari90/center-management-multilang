import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Group enrollments by subjectId and count how many students per subject
    const enrollments = await db.studentSubject.groupBy({
      by: ['subjectId'],
      where: {
        student: {
          managerId: session.user.id
        }
      },
      _count: {
        studentId: true // Avoid ambiguous 'id' field
      }
    })

    // Get subject details for the enrolled subjectIds
    const subjectsData = await db.subject.findMany({
      where: {
        id: {
          in: enrollments.map(e => e.subjectId)
        }
      },
      select: {
        id: true,
        name: true,
        price: true
      }
    })

    // Merge the enrollments and subject data
    const data = enrollments.map(enrollment => {
      const subject = subjectsData.find(s => s.id === enrollment.subjectId)
      return {
        subject: subject?.name || 'Unknown',
        students: enrollment._count.studentId,
        revenue: (subject?.price || 0) * enrollment._count.studentId
      }
    })
    .sort((a, b) => b.students - a.students) // Sort by most students
    .slice(0, 6) // Take top 6 subjects

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching enrollment data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

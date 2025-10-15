// app/api/admin/all-students/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const students = await db.student.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        parentName: true,
        parentPhone: true,
        parentEmail: true,
        grade: true,
        createdAt: true,
        manager: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            studentSubjects: true,
            receipts: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      grade: student.grade,
      createdAt: student.createdAt.toISOString(),
      manager: student.manager,
      stats: {
        subjects: student._count.studentSubjects,
        receipts: student._count.receipts,
      }
    }))

    return NextResponse.json(transformedStudents)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' }, 
      { status: 500 }
    )
  }
}
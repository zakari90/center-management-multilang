// app/api/students/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get students managed by this user
    const students = await db.student.findMany({
      where: {
        managerId: session.user.id
      },
      include: {
        studentSubjects: {
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

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      name, 
      email, 
      phone, 
      parentName, 
      parentPhone, 
      parentEmail, 
      grade,
      subjects 
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if email already exists
    if (email) {
      const existingStudent = await db.student.findUnique({
        where: { email }
      })
      
      if (existingStudent) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Create student with subjects in a transaction
    const student = await db.$transaction(async (tx) => {
      // Create the student
      const newStudent = await tx.student.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          parentEmail: parentEmail || null,
          grade: grade || null,
          managerId: session.user.id,
        },
      })

      // Create student-subject associations if subjects provided
      if (subjects && subjects.length > 0) {
        await tx.studentSubject.createMany({
          data: subjects.map((subjectId: string) => ({
            studentId: newStudent.id,
            subjectId: subjectId,
          }))
        })
      }

      // Return student with subjects
      return tx.student.findUnique({
        where: { id: newStudent.id },
        include: {
          studentSubjects: {
            include: {
              subject: true
            }
          }
        }
      })
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
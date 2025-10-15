import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the receipt with related student/teacher subjects and center
    const receipt = await db.receipt.findUnique({
      where: {
        id,
        managerId: session.user.id,
      },
      include: {
        student: {
          include: {
            studentSubjects: {
              include: {
                subject: {
                  include: {
                    center: true,
                  },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            teacherSubjects: {
              include: {
                subject: {
                  include: {
                    center: true,
                  },
                },
              },
            },
          },
        },
        manager: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Extract the center (only one expected)
    let center = null

    if (receipt.student?.studentSubjects?.length) {
      center = receipt.student.studentSubjects[0]?.subject?.center || null
    } else if (receipt.teacher?.teacherSubjects?.length) {
      center = receipt.teacher.teacherSubjects[0]?.subject?.center || null
    }

    return NextResponse.json({
      ...receipt,
      center: center
        ? {
            id: center.id,
            name: center.name,
            address: center.address,
            phone: center.phone,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

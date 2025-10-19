// app/api/admin/centers/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const centers = await db.center.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            subjects: true
          }
        }
      }
    })

    // Get counts for each center
    const centersWithStats = await Promise.all(
      centers.map(async (center) => {
        // Parse JSON fields from the current center
        const classrooms = center.classrooms as string[]
        const workingDays = center.workingDays as string[]
        const managerIds = (center.managers as string[]) || []

        const [students, teachers, receipts, managers] = await Promise.all([
          // Count students managed by this center's managers
          db.student.count({
            where: {
              managerId: { in: managerIds }
            }
          }),
          // Count teachers managed by this center's managers
          db.teacher.count({
            where: {
              managerId: { in: managerIds }
            }
          }),
          // Get receipts from this center's managers
          db.receipt.findMany({
            where: { 
              type: 'STUDENT_PAYMENT',
              managerId: { in: managerIds }
            },
            select: { amount: true }
          }),
          // Get manager details for this center
          managerIds.length > 0 
            ? db.user.findMany({
                where: {
                  id: { in: managerIds },
                  role: 'MANAGER'
                },
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              })
            : []
        ])

        const revenue = receipts.reduce((sum, r) => sum + r.amount, 0)

        return {
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms,
          workingDays,
          managers,
          admin: center.admin,
          studentsCount: students,
          teachersCount: teachers,
          subjectsCount: center._count.subjects,
          revenue,
          managersCount: managers.length,
          createdAt: center.createdAt,
          updatedAt: center.updatedAt
        }
      })
    )

    return NextResponse.json(centersWithStats)
  } catch (error) {
    console.error('Error fetching centers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/managers/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const session:any = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const managers = await db.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            managedStudents: true,
            managedTeachers: true,
            administeredCenters: true
          }
        }
      }
    })

    const managersWithStats = managers.map(manager => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      centersCount: manager._count.administeredCenters,
      studentsCount: manager._count.managedStudents,
      teachersCount: manager._count.managedTeachers
    }))

    return NextResponse.json(managersWithStats)
  } catch (error) {
    console.error('Error fetching managers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
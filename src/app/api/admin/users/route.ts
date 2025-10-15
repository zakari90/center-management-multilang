// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    
    // Check if user is authenticated and is an ADMIN
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }


    const users = await db.user.findMany({
      where: { role: "MANAGER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password:true,
        createdAt: true,
        _count: {
          select: {
            administeredCenters: true,
            managedStudents: true,
            managedTeachers: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match component interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password,
      createdAt: user.createdAt.toISOString(),
      stats: {
        centers: user._count.administeredCenters,
        students: user._count.managedStudents,
        teachers: user._count.managedTeachers,
      }
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
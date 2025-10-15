// app/api/admin/users/[id]/toggle-status/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const { id } = await params

    const session = await getSession()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Don't allow deactivating yourself
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    // Note: You'll need to add an 'isActive' field to your User model
    // For now, this is a placeholder
    const user = await db.user.findUnique({
      where: { id: id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Toggle the isActive status
    // await db.user.update({
    //   where: { id: params.id },
    //   data: { isActive: !user.isActive }
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling user status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
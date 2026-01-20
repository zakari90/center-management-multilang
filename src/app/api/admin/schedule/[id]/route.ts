/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/schedule/[id]/route.ts
import { getSession } from '@/lib/server-auth'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session: any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schedule = await db.schedule.findUnique({
      where: { id }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Allow admin to delete any schedule, or manager to delete their own
    const isAdmin = session.user.role === 'ADMIN'
    if (!isAdmin && schedule.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this schedule' }, { status: 403 })
    }

    await db.schedule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
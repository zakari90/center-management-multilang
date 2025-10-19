/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/schedule/[id]/route.ts
import { getSession } from '@/lib/authentication'
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

    if (!schedule || schedule.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
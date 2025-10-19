/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/students/[id]/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session :any = await getSession()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.student.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' }, 
      { status: 500 }
    )
  }
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session :any = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teachers = await db.teacher.findMany()

console.log("***************************************************************");
console.log(teachers);

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teachers' }, 
      { status: 500 }
    )
  }
}
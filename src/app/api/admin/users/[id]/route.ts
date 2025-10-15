// app/api/admin/users/[id]/route.ts
import { getSession } from '@/lib/authentication'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
        const { id } = await params
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
        const { id } = await params

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    console.log("Request body:", body.body);

    const {  name, email, role, password } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedManager = await db.user.update({
      where: { id },
      data: { name, email, role , password},
    });
    console.log("Updated manager:", updatedManager);
    

    return NextResponse.json(updatedManager, { status: 200 });
  } catch (error) {
    console.error("[UPDATE_MANAGER]", error);
    return NextResponse.json({ error: "Failed to update manager" }, { status: 500 });
  }
}
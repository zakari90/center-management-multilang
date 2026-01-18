/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/users/[id]/route.ts
import { getSession } from '@/lib/server-auth'
import db from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session :any = await getSession()
        const { id } = await params
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists first
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    
    // Handle Prisma P2025 error (record not found)
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found or already deleted' }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    )
  }
}

import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session :any = await getSession()
        const { id } = await params

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    
    const { name, email, role, password } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dataToUpdate: any = { name, email, role };
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
    }

    const updatedManager = await db.user.update({
      where: { id },
      data: dataToUpdate,
    });
    
    return NextResponse.json(updatedManager, { status: 200 });
  } catch (error) {
    console.error("[UPDATE_MANAGER]", error);
    return NextResponse.json({ error: "Failed to update manager" }, { status: 500 });
  }
}
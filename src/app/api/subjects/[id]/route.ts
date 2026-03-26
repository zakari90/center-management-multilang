/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        teacherSubjects: {
          include: {
            teacher: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error('[GET_SUBJECT_BY_ID]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Sanitize body to only include allowed fields for Prisma
    const { 
      name, 
      grade, 
      price, 
      duration, 
      centerId, 
      encryptedData, 
      createdAt, 
      updatedAt 
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (grade !== undefined) updateData.grade = grade;
    if (price !== undefined) updateData.price = typeof price === 'string' ? parseFloat(price) : price;
    if (duration !== undefined) updateData.duration = typeof duration === 'string' ? parseInt(duration) : duration;
    if (centerId !== undefined) updateData.centerId = centerId;
    if (encryptedData !== undefined) updateData.encryptedData = encryptedData;
    
    // Handle Date conversions for sync
    if (createdAt) updateData.createdAt = new Date(createdAt);
    if (updatedAt) updateData.updatedAt = new Date(updatedAt);

    const subject = await db.subject.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(subject);
  } catch (error: any) {
    console.error('[UPDATE_SUBJECT]', error);
    
    // Handle Prisma "Record not found" error
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update subject',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getSession();
    
    if (!(session?.user?.role === "ADMIN")) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    await db.subject.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_SUBJECT]', error);
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
}

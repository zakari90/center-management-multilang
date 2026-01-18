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

    const subject = await db.subject.update({
      where: { id },
      data: body
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error('[UPDATE_SUBJECT]', error);
    return NextResponse.json(
      { error: 'Failed to update subject' },
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

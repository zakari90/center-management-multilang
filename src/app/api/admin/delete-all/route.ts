/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/authentication';

export async function POST() {
  const session:any = await getSession();
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Delete join tables first
    await db.studentSubject.deleteMany({});
    await db.teacherSubject.deleteMany({});

    // Delete schedules first (depends on teacher, subject, manager, center)
    await db.schedule.deleteMany({});

    // Delete receipts (depends on teacher, student, manager)
    await db.receipt.deleteMany({});

    // Delete main tables
    await db.student.deleteMany({});
    await db.teacher.deleteMany({});
    await db.subject.deleteMany({});

    // Delete centers (depends on admin)
    await db.center.deleteMany({});

    // Optionally delete users except current admin
    await db.user.deleteMany({
      where: {
        id: { not: session.user.id }
      }
    });

    return NextResponse.json({ success: true, message: 'All data deleted.' });
  } catch (error) {
    console.error('Failed to delete all data:', error);
    return NextResponse.json({ error: 'Failed to delete all data.' }, { status: 500 });
  }
}

// src/app/api/admin/delete-all/route.ts

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/authentication";

export async function POST() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // 1. Delete JOIN/DEPENDENCY tables first (relations with required foreign keys)
    await db.studentSubject.deleteMany({});    // Student ↔ Subject relation
    await db.teacherSubject.deleteMany({});    // Teacher ↔ Subject relation

    // 2. Delete Schedules (if schedules reference teacher/student in required way)
    await db.schedule.deleteMany({});          

    // 3. Delete Receipts (if referencing teacher or student)
    await db.receipt.deleteMany({});          

    // 4. Delete dependent main tables last
    await db.student.deleteMany({});
    await db.teacher.deleteMany({});
    await db.subject.deleteMany({});
    
    // 5. Any other tables (logs, notifications, etc.)
    // await db.notification.deleteMany({});
    // await db.auditLog.deleteMany({});

    return NextResponse.json({ success: true, message: "All data deleted successfully." });
  } catch (error) {
    console.error("Admin Delete All Error:", error);
    return NextResponse.json({ error: "Failed to delete all data." }, { status: 500 });
  }
}

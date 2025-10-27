/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/admin/delete-all/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/authentication";

export async function POST() {
  const session:any = await getSession();
  
  // OPTIONAL: Restrict to admin only
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Danger! Deletes EVERYTHING:
  await db.student.deleteMany({});
  await db.teacher.deleteMany({});
  await db.schedule.deleteMany({});
  await db.receipt.deleteMany({});
  await db.subject.deleteMany({});
  // Add other collections as needed
  
  return NextResponse.json({ success: true });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/server-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session: any = await getSession();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Get password from request body
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to confirm this action" },
        { status: 400 },
      );
    }

    // Verify admin password
    const admin = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // Password verified - proceed with deletion
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
        id: { not: session.user.id },
      },
    });

    // Increment admin's dataEpoch to invalidate any cached data
    // Note: dataEpoch update can be done via raw query if needed
    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: { dataEpoch: crypto.randomUUID().slice(0, 8) },
    // });

    return NextResponse.json({ success: true, message: "All data deleted." });
  } catch (error) {
    console.error("Failed to delete all data:", error);
    return NextResponse.json(
      { error: "Failed to delete all data." },
      { status: 500 },
    );
  }
}

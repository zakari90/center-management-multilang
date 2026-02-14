/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET - Fetch delete requests (optionally filter by status)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const requests = await db.deleteRequest.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: requests });
  } catch (e) {
    console.error("Failed to fetch delete requests:", e);
    return NextResponse.json(
      { error: "Failed to fetch delete requests" },
      { status: 500 },
    );
  }
}

// POST - Create a new delete request (from manager)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, entityType, entityId, entityName, reason, requestedBy } = body;

    if (!entityType || !entityId || !entityName || !requestedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const deleteRequest = await db.deleteRequest.upsert({
      where: { id: id || "" },
      update: {
        entityType,
        entityId,
        entityName,
        reason,
        requestedBy,
        status: "PENDING",
      },
      create: {
        entityType,
        entityId,
        entityName,
        reason,
        requestedBy,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, data: deleteRequest });
  } catch (e) {
    console.error("Failed to create delete request:", e);
    return NextResponse.json(
      { error: "Failed to create delete request" },
      { status: 500 },
    );
  }
}

// PATCH - Approve or reject a delete request (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reviewedBy } = body;

    if (!id || !action || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Provide id and action (APPROVED/REJECTED)" },
        { status: 400 },
      );
    }

    const deleteRequest = await db.deleteRequest.update({
      where: { id },
      data: {
        status: action,
        reviewedBy,
      },
    });

    // If approved, actually delete the entity
    if (action === "APPROVED") {
      const { entityId, entityType } = deleteRequest;

      if (entityType === "teacher") {
        await db.teacher.delete({ where: { id: entityId } });
      } else if (entityType === "student") {
        await db.student.delete({ where: { id: entityId } });
      } else if (entityType === "subject") {
        // Cascading delete for subject: teacher-subject links, student-subject links, and schedules
        await Promise.all([
          db.teacherSubject.deleteMany({ where: { subjectId: entityId } }),
          db.studentSubject.deleteMany({ where: { subjectId: entityId } }),
          db.schedule.deleteMany({ where: { subjectId: entityId } }),
          db.subject.delete({ where: { id: entityId } }),
        ]);
      } else if (entityType === "schedule") {
        await db.schedule.delete({ where: { id: entityId } });
      } else if (entityType === "receipt") {
        await db.receipt.delete({ where: { id: entityId } });
      } else if (entityType === "teacherSubject") {
        await db.teacherSubject.delete({ where: { id: entityId } });
      } else if (entityType === "studentSubject") {
        await db.studentSubject.delete({ where: { id: entityId } });
      }
    }

    return NextResponse.json({ ok: true, data: deleteRequest });
  } catch (e) {
    console.error("Failed to update delete request:", e);
    return NextResponse.json(
      { error: "Failed to update delete request" },
      { status: 500 },
    );
  }
}

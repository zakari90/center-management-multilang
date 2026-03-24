/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      day,
      startTime,
      endTime,
      teacherId,
      subjectId,
      roomId,
      centerId,
      encryptedData,
    } = body;

    // If E2EE encrypted data is present, skip strict validation
    const isEncrypted = !!encryptedData || startTime === "ENCRYPTED";

    // Validation
    if (
      !isEncrypted &&
      (!day || !startTime || !endTime || !teacherId || !subjectId || !roomId)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check for conflicts - skip or be lenient for encrypted dummy values
    const isDummyTime = startTime === "ENCRYPTED" || day === "ENCRYPTED";

    let teacherConflict = null;
    let roomConflict = null;

    if (!isEncrypted || !isDummyTime) {
      // Only check for conflicts if we have real time data
      teacherConflict = await db.schedule.findFirst({
        where: {
          teacherId,
          day,
          startTime,
        },
      });

      if (teacherConflict && !body.allowOverwrite) {
        return NextResponse.json(
          {
            error: {
              message: "Teacher already has a class at this time",
              code: "TEACHER_CONFLICT",
              details: { day, startTime, teacherId },
            },
          },
          { status: 409 },
        );
      }

      roomConflict = await db.schedule.findFirst({
        where: {
          roomId,
          day,
          startTime,
          centerId: centerId || null,
        },
      });

      if (roomConflict && !body.allowOverwrite) {
        return NextResponse.json(
          {
            error: {
              message: "Room is already booked at this time",
              code: "ROOM_CONFLICT",
              details: { day, startTime, roomId, centerId },
            },
          },
          { status: 409 },
        );
      }
    }

    // Handle overwrite: Delete conflicting schedules if they exist
    if (body.allowOverwrite) {
      if (teacherConflict) {
        await db.schedule.delete({ where: { id: teacherConflict.id } });
      }
      if (roomConflict && roomConflict.id !== teacherConflict?.id) {
        await db.schedule.delete({ where: { id: roomConflict.id } });
      }
    }

    // Create schedule
    const schedule = await db.schedule.create({
      data: {
        id: id || undefined,
        day,
        startTime,
        endTime,
        roomId,
        teacherId,
        subjectId,
        managerId: session.user.id,
        centerId: centerId || null,
        ...(isEncrypted && encryptedData && { encryptedData }),
      },
      include: {
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, grade: true } },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Schedule creation error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: {
          message: errorMsg,
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // const { searchParams } = new URL(req.url)
  // const centerId = searchParams.get('centerId')

  const schedules = await db.schedule.findMany({
    // where: {

    //   managerId: session.user.id,
    //   ...(centerId && { centerId })
    // },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          weeklySchedule: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          grade: true,
        },
      },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}

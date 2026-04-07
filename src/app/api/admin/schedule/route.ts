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

    let teacherConflict: any = null;
    let roomConflict: any = null;

    if (!isEncrypted || !isDummyTime) {
      // Fetch teacher to respect their overrideConflicts setting
      const teacher = await db.teacher.findUnique({
        where: { id: teacherId }
      });

      // Fetch possible conflicting schedules for the target teacher and room on that day
      const daySchedules = await db.schedule.findMany({
        where: {
          day,
          OR: [
            { teacherId },
            { roomId, centerId: centerId || null }
          ]
        }
      });

      // Filter in memory for time overlaps
      const overlappingSchedules = daySchedules.filter(
        (s) => s.startTime < endTime && s.endTime > startTime
      );

      teacherConflict = overlappingSchedules.find(s => s.teacherId === teacherId);

      // If teacher explicitly allows conflicts, ignore the teacher constraint 
      if ((teacher as any)?.overrideConflicts) {
        teacherConflict = undefined;
      }

      if (teacherConflict && !body.allowOverwrite) {
        return NextResponse.json(
          {
            error: {
              message: "Teacher already has a class at this time",
              code: "TEACHER_CONFLICT",
              details: { day, startTime, endTime, teacherId },
            },
          },
          { status: 409 },
        );
      }

      roomConflict = overlappingSchedules.find(s => 
        s.roomId === roomId &&
        (s.centerId === (centerId || null))
      );

      if (roomConflict && !body.allowOverwrite) {
        return NextResponse.json(
          {
            error: {
              message: "Room is already booked at this time",
              code: "ROOM_CONFLICT",
              details: { day, startTime, endTime, roomId, centerId },
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

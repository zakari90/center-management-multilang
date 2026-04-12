import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/public/teachers - Public endpoint for visitors to see available teachers
// No authentication required. Response is never cached.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get("centerId");

    // Fetch teachers who have subjects in this center
    // If no centerId, get all teachers
    const teachers = await db.teacher.findMany({
      where: centerId ? {
        teacherSubjects: {
          some: {
            subject: {
              centerId: centerId
            }
          }
        }
      } : undefined,
      select: {
        id: true,
        name: true,
        teacherSubjects: {
          include: {
            subject: {
              select: {
                name: true,
                grade: true,
              }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    });

    // Format the response to be cleaner
    const formattedTeachers = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        subjects: Array.from(new Set(teacher.teacherSubjects.map(ts => ts.subject.name))),
        grades: Array.from(new Set(teacher.teacherSubjects.map(ts => ts.subject.grade))),
    }));

    return NextResponse.json(formattedTeachers, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[PUBLIC_TEACHERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 },
    );
  }
}

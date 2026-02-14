/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { SubjectInputSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeTeachers = searchParams.get("includeTeachers") === "true";

    const subjects = await db.subject.findMany({
      include: includeTeachers
        ? {
            teacherSubjects: {
              include: {
                teacher: true,
              },
            },
          }
        : undefined,
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const result = SubjectInputSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, grade, price, duration, centerId } = result.data;
    const { id, createdAt, updatedAt } = body;

    // Standard POST only creates. If it exists, return 409 conflict.
    if (id) {
      const existingSubject = await db.subject.findUnique({
        where: { id },
      });

      if (existingSubject) {
        return NextResponse.json(
          { error: "Subject already exists" },
          { status: 409 },
        );
      }
    }

    const subject = await db.subject.create({
      data: {
        id: id || undefined,
        name,
        grade,
        price,
        duration,
        centerId,
        ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
        ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      return NextResponse.json(
        { error: "Subject with this ID already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create subject",
        details:
          process.env.NODE_ENV === "development"
            ? (error as any)?.message
            : undefined,
      },
      { status: 500 },
    );
  }
}

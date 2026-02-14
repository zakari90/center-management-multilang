/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/students/route.ts
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { StudentInputSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    const session: any = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all students (managers can see all data)
    const students = await db.student.findMany({
      include: {
        studentSubjects: {
          include: {
            subject: true,
          },
        },
        _count: {
          select: {
            receipts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const result = StudentInputSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      phone,
      parentName,
      parentPhone,
      parentEmail,
      grade,
      enrollments,
    } = result.data;

    const { id } = body; // Extract ID separately as it's not in the input schema (optional)

    // Check if student with same ID already exists (for sync conflict handling)
    if (id) {
      const existingStudentById = await db.student.findUnique({
        where: { id },
      });

      if (existingStudentById) {
        return NextResponse.json(
          { error: "Student with this ID already exists" },
          { status: 409 },
        );
      }
    }

    // Check if email already exists
    if (email) {
      const existingStudent = await db.student.findUnique({
        where: { email },
      });

      if (existingStudent) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 },
        );
      }
    }

    // Create student with enrollments in a transaction
    const student = await db.$transaction(async (tx: any) => {
      // Create the student
      const newStudent = await tx.student.create({
        data: {
          ...(id && { id }),
          name,
          email: email || null,
          phone: phone || null,
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          parentEmail: parentEmail || null,
          grade: grade || null,
          managerId: session.user.id,
        },
      });

      // Create student-subject-teacher associations if enrollments provided
      if (enrollments && enrollments.length > 0) {
        await tx.studentSubject.createMany({
          data: enrollments.map(
            (enrollment: {
              id?: string;
              subjectId: string;
              teacherId: string;
            }) => ({
              ...(enrollment.id && { id: enrollment.id }),
              studentId: newStudent.id,
              subjectId: enrollment.subjectId,
              teacherId: enrollment.teacherId,
            }),
          ),
        });
      }

      // Return student with subjects
      return tx.student.findUnique({
        where: { id: newStudent.id },
        include: {
          studentSubjects: {
            include: {
              subject: true,
              teacher: true, // ← Include teacher info too
            },
          },
        },
      });
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

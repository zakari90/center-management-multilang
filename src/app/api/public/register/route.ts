import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for public registration
const PublicRegistrationSchema = z.object({
  type: z.enum(["student", "teacher"]),
  centerId: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Phone must be at least 8 characters"),
  email: z.string().email().optional().or(z.literal("")),
  grade: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  selectedSubjects: z.array(z.string()).optional(),
});

// POST /api/public/register - Public registration for students/teachers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = PublicRegistrationSchema.safeParse(body);
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
      type,
      name,
      phone,
      email,
      grade,
      parentName,
      parentPhone,
      centerId,
    } = result.data;

    // Get the center to find a manager to assign
    const center = await db.center.findFirst({
      where: centerId ? { id: centerId } : undefined,
      include: { admin: true },
    });

    if (!center) {
      return NextResponse.json({ error: "Center not found" }, { status: 404 });
    }

    // Check if public registration is enabled
    if (!center.publicRegistrationEnabled) {
      return NextResponse.json(
        { error: "Public registration is currently disabled" },
        { status: 403 },
      );
    }

    // Use admin as the manager for new registrations
    const managerId = center.adminId;

    if (type === "student") {
      // Check for existing student with same phone or email
      const existingStudent = await db.student.findFirst({
        where: {
          OR: [{ phone }, ...(email ? [{ email }] : [])],
        },
      });

      if (existingStudent) {
        return NextResponse.json(
          { error: "A student with this phone or email already exists" },
          { status: 409 },
        );
      }

      // Create new student
      const student = await db.student.create({
        data: {
          name,
          phone,
          email: email || null,
          grade: grade || null,
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          managerId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Student registration successful",
          id: student.id,
        },
        { status: 201 },
      );
    } else {
      // Teacher registration
      const existingTeacher = await db.teacher.findFirst({
        where: {
          OR: [{ phone }, ...(email ? [{ email }] : [])],
        },
      });

      if (existingTeacher) {
        return NextResponse.json(
          { error: "A teacher with this phone or email already exists" },
          { status: 409 },
        );
      }

      // Create new teacher
      const teacher = await db.teacher.create({
        data: {
          name,
          phone,
          email: email || null,
          managerId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Teacher registration successful",
          id: teacher.id,
        },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error("[PUBLIC_REGISTER_POST]", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}

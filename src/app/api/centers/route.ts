/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { CenterInputSchema } from "@/lib/validations/schemas";

// GET handler: Unified listing with optional stats
export async function GET(req: NextRequest) {
  try {
    const session: any = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const withStats = searchParams.get("stats") === "true";
    const adminId = session.user.id;
    const userRole = session.user.role;

    // Filter centers based on role
    const where =
      userRole === "ADMIN"
        ? {}
        : { OR: [{ adminId: adminId }, { managers: { has: adminId } }] };

    const centers = await db.center.findMany({
      where,
      include: {
        subjects: true,
        admin: { select: { id: true, name: true, email: true } },
        _count: { select: { subjects: true } },
      },
    });

    if (!withStats || userRole !== "ADMIN") {
      return NextResponse.json(centers);
    }

    // Advanced Admin stats (merged from api/admin/centers)
    const centersWithStats = await Promise.all(
      centers.map(async (center: any) => {
        const managerIds = Array.isArray(center.managers)
          ? (center.managers as string[])
          : [];

        const [students, teachers, receipts, managers] = await Promise.all([
          db.student.count({ where: { managerId: { in: managerIds } } }),
          db.teacher.count({ where: { managerId: { in: managerIds } } }),
          db.receipt.findMany({
            where: { type: "STUDENT_PAYMENT", managerId: { in: managerIds } },
            select: { amount: true },
          }),
          managerIds.length
            ? db.user.findMany({
                where: { id: { in: managerIds }, role: "MANAGER" },
                select: { id: true, name: true, email: true },
              })
            : Promise.resolve([]),
        ]);

        const revenue = receipts.reduce(
          (sum: number, r: any) => sum + r.amount,
          0,
        );

        return {
          ...center,
          studentsCount: students,
          teachersCount: teachers,
          subjectsCount: center._count.subjects,
          revenue,
          managersCount: managers.length,
          managers,
        };
      }),
    );

    return NextResponse.json(centersWithStats);
  } catch (error) {
    console.error("Error fetching centers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST handler: Create or Update (standardized)
export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = CenterInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id, adminId } = body;
    const data = { ...result.data, adminId: adminId || session.user.id };

    if (id) {
      const existing = await db.center.findUnique({ where: { id } });
      if (existing) {
        const updated = await db.center.update({
          where: { id },
          data: { ...data, updatedAt: new Date() },
        });
        return NextResponse.json(updated);
      }
    }

    const center = await db.center.create({
      data: { ...data, id: id || undefined },
    });

    return NextResponse.json(center, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Center already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH handler: Partial update (Homepage, etc)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { centerId, ...updateData } = body;

    if (!centerId) {
      return NextResponse.json(
        { error: "Center ID is required" },
        { status: 400 },
      );
    }

    const center = await db.center.update({
      where: { id: centerId },
      data: { ...updateData, updatedAt: new Date() },
    });

    return NextResponse.json(center);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update center" },
      { status: 500 },
    );
  }
}

// DELETE handler: Delete center via query param
export async function DELETE(req: NextRequest) {
  try {
    const session: any = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing center ID" }, { status: 400 });
    }

    await db.center.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete center" },
      { status: 500 },
    );
  }
}

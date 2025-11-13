/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/authentication";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id, // ✅ Accept client-provided ID for offline-first sync
      name, 
      address, 
      phone, 
      classrooms, 
      workingDays, 
      subjects,
      createdAt,
      updatedAt
    } = body;

    console.log("Data received:", {
      id, name, address, phone, classrooms, workingDays, subjects 
    });

    // Validation
    if (!id || !name || !Array.isArray(classrooms) || !Array.isArray(workingDays)) {
      return NextResponse.json({ 
        error: "Missing or invalid fields. ID and name are required, classrooms and workingDays must be arrays" 
      }, { status: 400 });
    }

    // Additional validation for subjects
    if (subjects && !Array.isArray(subjects)) {
      return NextResponse.json({ 
        error: "Subjects must be an array" 
      }, { status: 400 });
    }

    // ✅ Use upsert for idempotency - prevents duplicates on retry
    const center = await db.center.upsert({
      where: { id }, // Check if center with this ID already exists
      update: {
        // If exists, update it (makes request idempotent)
        name,
        address: address || null,
        phone: phone || null,
        classrooms,
        workingDays,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
      create: {
        // If doesn't exist, create it
        id, // Use client-provided ID
        name,
        address: address || null,
        phone: phone || null,
        classrooms,
        workingDays,
        adminId: session.user.id,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        subjects: {
          create: subjects?.map((subject: any) => ({
            id: subject.id, // ✅ Accept subject IDs from client
            name: subject.name,
            grade: subject.grade,
            price: subject.price,
            duration: subject.duration || null,
            createdAt: subject.createdAt ? new Date(subject.createdAt) : new Date(),
            updatedAt: subject.updatedAt ? new Date(subject.updatedAt) : new Date(),
          })) || []
        }
      },
      include: {
        subjects: true
      }
    });

    return NextResponse.json(center, { status: 201 });
  } catch (error) {
    console.error("[CENTER_POST]", error);
    return NextResponse.json({ 
      error: "Failed to create center",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session: any = await getSession();

    // ✅ Fixed: was checking "in" instead of role equality
    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // ✅ Filter by role - admins see their centers, managers see assigned centers
    const whereClause = session.user.role === "ADMIN" 
      ? { adminId: session.user.id }
      : { managers: { has: session.user.id } }; // For managers

    const centers = await db.center.findMany({
      where: whereClause,
      include: { subjects: true },
      orderBy: { createdAt: 'desc' } // ✅ Most recent first
    });

    return NextResponse.json(centers, { status: 200 }); // ✅ Fixed: should be 200, not 201
  } catch (error) {
    console.error("[CENTER_GET]", error);
    return NextResponse.json({ 
      error: "Failed to get center data",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { centerId, name, address, phone, classrooms, workingDays, updatedAt } = body;

    if (!centerId) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      );
    }

    // ✅ Verify ownership before updating
    const existingCenter = await db.center.findUnique({
      where: { id: centerId },
      select: { adminId: true }
    });

    if (!existingCenter) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      );
    }

    if (existingCenter.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this center' },
        { status: 403 }
      );
    }

    const center = await db.center.update({
      where: { id: centerId },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(classrooms && { classrooms }),
        ...(workingDays && { workingDays }),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      }
    });

    return NextResponse.json(center);
  } catch (error) {
    console.error("[CENTER_PATCH]", error);
    return NextResponse.json(
      { error: 'Failed to update center' },
      { status: 500 }
    );
  }
}

// ✅ Add DELETE endpoint for completeness
export async function DELETE(request: Request) {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get('id');

    if (!centerId) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingCenter = await db.center.findUnique({
      where: { id: centerId },
      select: { adminId: true }
    });

    if (!existingCenter) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      );
    }

    if (existingCenter.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this center' },
        { status: 403 }
      );
    }

    // Delete center (cascade will delete related subjects)
    await db.center.delete({
      where: { id: centerId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[CENTER_DELETE]", error);
    return NextResponse.json(
      { error: 'Failed to delete center' },
      { status: 500 }
    );
  }
}

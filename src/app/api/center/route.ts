/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/authentication";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ 
        error: "Unauthorized: No session found. Please log in again." 
      }, { status: 401 });
    }

    // ✅ Normalize role to uppercase for comparison
    const userRole = typeof session.user.role === 'string' 
      ? session.user.role.toUpperCase() 
      : session.user.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ 
        error: `Unauthorized: Admin access required. Current role: ${userRole}` 
      }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id,
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

    // ✅ Check if center already exists
    const existingCenter = await db.center.findUnique({
      where: { id },
      include: { subjects: true }
    });

    let center: any;
    
    if (existingCenter) {
      // ✅ Center exists - update it (idempotent)
      center = await db.center.update({
        where: { id },
        data: {
          name,
          address: address || null,
          phone: phone || null,
          classrooms,
          workingDays,
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        },
        include: {
          subjects: true
        }
      });
    } else {
      // ✅ Center doesn't exist - create it
      center = await db.center.create({
        data: {
          id, // Use client-provided ID
          name,
          address: address || null,
          phone: phone || null,
          classrooms,
          workingDays,
          adminId: session.user.id,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        },
        include: {
          subjects: true
        }
      });

      // ✅ Create subjects separately if provided
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        try {
          // Use Promise.allSettled to handle individual subject creation failures
          const subjectResults = await Promise.allSettled(
            subjects.map(async (subject: any) => {
              // Check if subject already exists
              const existingSubject = await db.subject.findUnique({
                where: { id: subject.id }
              });

              if (existingSubject) {
                // Update existing subject
                return await db.subject.update({
                  where: { id: subject.id },
                  data: {
                    name: subject.name,
                    grade: subject.grade,
                    price: subject.price,
                    duration: subject.duration || null,
                    updatedAt: subject.updatedAt ? new Date(subject.updatedAt) : new Date(),
                  }
                });
              } else {
                // Create new subject
                return await db.subject.create({
                  data: {
                    id: subject.id,
                    name: subject.name,
                    grade: subject.grade,
                    price: subject.price,
                    duration: subject.duration || null,
                    centerId: center!.id,
                    createdAt: subject.createdAt ? new Date(subject.createdAt) : new Date(),
                    updatedAt: subject.updatedAt ? new Date(subject.updatedAt) : new Date(),
                  }
                });
              }
            })
          );

          // Log any failed subject creations
          const failedSubjects = subjectResults
            .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
            .map((result, index) => ({ index, reason: result.reason }));
          
          if (failedSubjects.length > 0) {
            console.warn("[CENTER_POST] Some subjects failed to create:", failedSubjects);
          }

          // Reload center with subjects
          center = await db.center.findUnique({
            where: { id },
            include: { subjects: true }
          });
        } catch (subjectError) {
          console.error("[CENTER_POST] Error creating subjects:", subjectError);
          // Don't fail the entire request if subjects fail - center is created
        }
      }
    }

    return NextResponse.json(center, { status: existingCenter ? 200 : 201 });
  } catch (error: any) {
    // Log full error details for debugging
    console.error("[CENTER_POST] Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      name: error?.name,
      // Include stack only in development
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
    });
    
    // Check for common MongoDB/Prisma errors
    let errorMessage = 'Failed to create center';
    let statusCode = 500;
    
    if (error?.code === 'P2002') {
      errorMessage = 'Center with this ID already exists';
      statusCode = 409;
    } else if (error?.code === 'P2025') {
      errorMessage = 'Center not found';
      statusCode = 404;
    } else if (error?.message?.includes('ObjectId')) {
      errorMessage = 'Invalid center ID format';
      statusCode = 400;
    } else if (error?.message) {
      errorMessage = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to create center';
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        name: error?.name
      } : undefined
    }, { status: statusCode });
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

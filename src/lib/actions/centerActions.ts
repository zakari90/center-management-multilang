"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
import db from "@/lib/db";
import { getSession } from "../actionsClient";

export async function saveCenterToDatabase(centerData: {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  classrooms: string[];
  workingDays: string[];
  subjects?: Array<{
    id: string;
    name: string;
    grade: string;
    price: number;
    duration?: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}) {
  try {
    const session: any = await getSession();

    if (!session || !session.user) {
      throw new Error("Unauthorized: No session found. Please log in again.");
    }

    // ✅ Normalize role to uppercase for comparison
    const userRole = typeof session.user.role === 'string' 
      ? session.user.role.toUpperCase() 
      : session.user.role;

    if (userRole !== "ADMIN") {
      throw new Error(`Unauthorized: Admin access required. Current role: ${userRole}`);
    }

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
    } = centerData;

    // Validation
    if (!id || !name || !Array.isArray(classrooms) || !Array.isArray(workingDays)) {
      throw new Error("Missing or invalid fields. ID and name are required, classrooms and workingDays must be arrays");
    }

    // Additional validation for subjects
    if (subjects && !Array.isArray(subjects)) {
      throw new Error("Subjects must be an array");
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
                    centerId: center.id,
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
            console.warn("[CENTER_SAVE] Some subjects failed to create:", failedSubjects);
          }

          // Reload center with subjects
          center = await db.center.findUnique({
            where: { id },
            include: { subjects: true }
          });
        } catch (subjectError) {
          console.error("[CENTER_SAVE] Error creating subjects:", subjectError);
          // Don't fail the entire request if subjects fail - center is created
        }
      }
    }

    return { success: true, data: center };
  } catch (error: any) {
    console.error("[CENTER_SAVE] Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    
    throw error; // Re-throw to let caller handle it
  }
}

export async function deleteCenterFromDatabase(centerId: string) {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    // Verify ownership
    const existingCenter = await db.center.findUnique({
      where: { id: centerId },
      select: { adminId: true }
    });

    if (!existingCenter) {
      throw new Error('Center not found');
    }

    if (existingCenter.adminId !== session.user.id) {
      throw new Error('Forbidden: You do not own this center');
    }

    // Delete center (cascade will delete related subjects)
    await db.center.delete({
      where: { id: centerId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[CENTER_DELETE] Error:", error);
    throw error;
  }
}

export async function getCentersFromDatabase() {
  try {
    const session: any = await getSession();

    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      throw new Error("Unauthorized");
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

    return { success: true, data: centers };
  } catch (error: any) {
    console.error("[CENTER_GET] Error:", error);
    throw error;
  }
}


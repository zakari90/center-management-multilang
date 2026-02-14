import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { notifyNewDeleteRequest } from "@/lib/notificationTrigger";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const {
      entityId,
      entityType,
      entityName,
      reason,
      requestedBy,
      managerName,
    } = await req.json();

    if (!entityId || !entityType || !requestedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the DeleteRequest in the database
    const deleteRequest = await prisma.deleteRequest.create({
      data: {
        entityId,
        entityType, // "teacher" | "student"
        entityName,
        reason,
        requestedBy,
        status: "PENDING",
      },
    });

    // Notify Admins
    if (managerName) {
      // Don't await this to keep the response fast
      notifyNewDeleteRequest(managerName, entityType, entityName, reason).catch(
        (err) =>
          console.error("Failed to trigger delete request notification:", err),
      );
    }

    return NextResponse.json({ success: true, data: deleteRequest });
  } catch (error) {
    console.error("Error creating delete request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

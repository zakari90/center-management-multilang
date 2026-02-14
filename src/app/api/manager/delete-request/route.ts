import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { DeleteRequestStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { entityId, entityType, entityName, reason, requestedBy } =
      await req.json();

    if (!entityId || !entityType || !requestedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the DeleteRequest in the database
    const deleteRequest = await db.deleteRequest.create({
      data: {
        entityId,
        entityType, // "teacher" | "student"
        entityName,
        reason,
        requestedBy,
        status: DeleteRequestStatus.PENDING,
      },
    });

    return NextResponse.json({ success: true, data: deleteRequest });
  } catch (error) {
    console.error("Error creating delete request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

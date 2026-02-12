import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * GET /api/admin/check-admin
 * Check if an admin account exists in the system
 * Public endpoint - no authentication required
 */
export async function GET() {
  try {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    return NextResponse.json({
      hasAdmin: !!admin,
    });
  } catch (error) {
    console.error("Failed to check admin existence:", error);
    return NextResponse.json(
      { error: "Failed to check admin existence" },
      { status: 500 },
    );
  }
}

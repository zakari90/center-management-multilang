import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * GET /api/admin/check-admin
 * Check if an admin account exists in the system
 * Public endpoint - no authentication required
 */
export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: {
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      hasAdmin: adminCount > 0,
      count: adminCount,
    });
  } catch (error) {
    console.error("Failed to check admin existence:", error);
    return NextResponse.json(
      { error: "Failed to check admin existence" },
      { status: 500 },
    );
  }
}

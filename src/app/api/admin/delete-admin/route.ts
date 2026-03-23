import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * DELETE /api/admin/delete-admin
 * Deletes the admin account from the system (for testing/recovery purposes)
 * Public endpoint
 */
export async function DELETE() {
  try {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (admin) {
      await db.user.delete({
        where: { id: admin.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 },
    );
  }
}

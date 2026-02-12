import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // Simple test - just try to find a user (won't error if collection is empty)
    await db.user.findMany();

    return NextResponse.json({
      success: true,
      message: "✓ Connected to MongoDB successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

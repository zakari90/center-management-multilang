import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/public/subjects - Public endpoint for visitors to see available grades & subjects
// No authentication required. Response is never cached so visitors always get fresh data.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get("centerId");

    // Build the query — if centerId is provided, filter by it; otherwise get all
    const subjects = await db.subject.findMany({
      where: centerId ? { centerId } : undefined,
      select: {
        id: true,
        name: true,
        grade: true,
        price: true,
      },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(subjects, {
      headers: {
        // Prevent any caching — visitors must always get fresh data
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[PUBLIC_SUBJECTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 },
    );
  }
}

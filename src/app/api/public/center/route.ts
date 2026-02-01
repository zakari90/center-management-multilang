import db from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/public/center - Get public center info for homepage
export async function GET() {
  try {
    // Get the first center (assuming single-center setup)
    // In multi-tenant setup, this would need different logic
    const center = await db.center.findFirst({
      select: {
        id: true,
        name: true,
        homeTitle: true,
        homeSubtitle: true,
        homeBadge: true,
        homeDescription: true,
        homeCtaText: true,
        homePhone: true,
        homeAddress: true,
        publicRegistrationEnabled: true,
      },
    });

    if (!center) {
      return NextResponse.json({ error: "No center found" }, { status: 404 });
    }

    return NextResponse.json(center);
  } catch (error) {
    console.error("[PUBLIC_CENTER_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch center info" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET - Fetch admin notification preferences
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notifyNewUser: true,
        notifyPayments: true,
        notifyDeleteRequests: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (e) {
    console.error("Failed to fetch notification preferences:", e);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

// PATCH - Update admin notification preferences
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, notifyNewUser, notifyPayments, notifyDeleteRequests } =
      body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(notifyNewUser !== undefined && { notifyNewUser }),
        ...(notifyPayments !== undefined && { notifyPayments }),
        ...(notifyDeleteRequests !== undefined && { notifyDeleteRequests }),
      },
      select: {
        id: true,
        notifyNewUser: true,
        notifyPayments: true,
        notifyDeleteRequests: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    console.error("Failed to update notification preferences:", e);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}

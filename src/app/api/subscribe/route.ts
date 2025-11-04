import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db"; // Your PrismaClient singleton import

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body should include 'endpoint', 'keys', 'userId', and 'role'
    const { endpoint, keys, userId, role } = body;

    // Upsert: create new or update existing
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: { keys, userId, role },
      create: { endpoint, keys, userId, role },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Subscribe error:", e);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

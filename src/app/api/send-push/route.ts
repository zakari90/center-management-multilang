import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import webpush from "web-push";

const PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY";
const PRIVATE_KEY = "YOUR_VAPID_PRIVATE_KEY";
webpush.setVapidDetails("mailto:admin@yourdomain.com", PUBLIC_KEY, PRIVATE_KEY);

export async function POST(req: NextRequest) {
  try {
    const { title, body, userId, role } = await req.json();

    // Find subscriptions by user or role
    const where = userId
      ? { userId }
      : role
        ? { role }
        : {};

    const subs = await db.pushSubscription.findMany({ where });

    const payload = JSON.stringify({ title, body });

    for (const sub of subs) {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
    }

    return NextResponse.json({ ok: true, sent: subs.length });
  } catch (e) {
    console.error("Push error:", e);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}

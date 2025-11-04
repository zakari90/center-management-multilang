import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import webpush from "web-push";

// Get VAPID keys from environment variables
const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY|| "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@yourdomain.com";

// Only initialize VAPID if valid keys are provided
let isVapidConfigured = false;
if (PUBLIC_KEY && PRIVATE_KEY && PUBLIC_KEY !== "YOUR_VAPID_PUBLIC_KEY" && PRIVATE_KEY !== "YOUR_VAPID_PRIVATE_KEY") {
  try {
    webpush.setVapidDetails(VAPID_EMAIL, PUBLIC_KEY, PRIVATE_KEY);
    isVapidConfigured = true;
  } catch (error) {
    console.error("Failed to set VAPID details:", error);
    isVapidConfigured = false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if VAPID is configured
    if (!isVapidConfigured) {
      return NextResponse.json(
        { 
          error: "Push notifications not configured. Please set VAPID keys in environment variables.",
          configured: false 
        },
        { status: 503 }
      );
    }

    const { title, body, userId, role } = await req.json();

    // Find subscriptions by user or role
    const where = userId
      ? { userId }
      : role
        ? { role }
        : {};

    const subs = await db.pushSubscription.findMany({ where });

    if (subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({ title, body });
    let successCount = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to send notification to ${sub.endpoint}:`, error);
        errors.push(`Subscription ${sub.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      sent: successCount,
      total: subs.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    console.error("Push error:", e);
    return NextResponse.json(
      { error: "Failed to send push notifications", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

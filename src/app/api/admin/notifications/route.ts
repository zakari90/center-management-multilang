/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET - Fetch notifications for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const notifications = await db.appNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await db.appNotification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ ok: true, data: notifications, unreadCount });
  } catch (e) {
    console.error("Failed to fetch notifications:", e);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, notificationIds, markAll } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (markAll) {
      await db.appNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      await db.appNotification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to update notifications:", e);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}

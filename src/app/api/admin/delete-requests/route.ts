/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET - Fetch delete requests (optionally filter by status)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const requests = await db.deleteRequest.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: requests });
  } catch (e) {
    console.error("Failed to fetch delete requests:", e);
    return NextResponse.json(
      { error: "Failed to fetch delete requests" },
      { status: 500 },
    );
  }
}

// POST - Create a new delete request (from manager)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, entityType, entityId, entityName, reason, requestedBy } = body;

    if (!entityType || !entityId || !entityName || !requestedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const deleteRequest = await db.deleteRequest.upsert({
      where: { id: id || "" },
      update: {
        entityType,
        entityId,
        entityName,
        reason,
        requestedBy,
        status: "PENDING",
      },
      create: {
        entityType,
        entityId,
        entityName,
        reason,
        requestedBy,
        status: "PENDING",
      },
    });

    // Send push notification to admin(s)
    try {
      const admins = await db.user.findMany({
        where: { role: "ADMIN", notifyDeleteRequests: true },
      });

      for (const admin of admins) {
        // Create in-app notification for admin
        await db.appNotification.create({
          data: {
            userId: admin.id,
            type: "delete_request",
            title: "Delete Request",
            body: `A manager wants to delete ${entityType}: ${entityName}`,
            isRead: false,
            data: {
              entityType,
              entityId,
              entityName,
              requestedBy,
              deleteRequestId: deleteRequest.id,
            },
          },
        });
      }

      // Send web push to all admins
      const adminSubs = await db.pushSubscription.findMany({
        where: { role: "ADMIN" },
      });

      if (adminSubs.length > 0) {
        const payload = JSON.stringify({
          title: "Delete Request",
          body: `A manager wants to delete ${entityType}: ${entityName}`,
          type: "delete_request",
        });

        const webpush = (await import("web-push")).default;
        const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY || "";
        const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY || "";
        const VAPID_EMAIL =
          process.env.VAPID_EMAIL || "mailto:admin@yourdomain.com";

        if (PUBLIC_KEY && PRIVATE_KEY) {
          webpush.setVapidDetails(VAPID_EMAIL, PUBLIC_KEY, PRIVATE_KEY);
          for (const sub of adminSubs) {
            try {
              const keys = sub.keys as { p256dh?: string; auth?: string };
              if (keys?.p256dh && keys?.auth) {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: keys.p256dh, auth: keys.auth },
                  },
                  payload,
                );
              }
            } catch (pushErr) {
              console.error("Push failed for admin:", pushErr);
            }
          }
        }
      }
    } catch (notifyErr) {
      console.error("Notification failed (non-blocking):", notifyErr);
    }

    return NextResponse.json({ ok: true, data: deleteRequest });
  } catch (e) {
    console.error("Failed to create delete request:", e);
    return NextResponse.json(
      { error: "Failed to create delete request" },
      { status: 500 },
    );
  }
}

// PATCH - Approve or reject a delete request (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reviewedBy } = body;

    if (!id || !action || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Provide id and action (APPROVED/REJECTED)" },
        { status: 400 },
      );
    }

    const deleteRequest = await db.deleteRequest.update({
      where: { id },
      data: {
        status: action,
        reviewedBy,
      },
    });

    // If approved, actually delete the entity
    if (action === "APPROVED") {
      if (deleteRequest.entityType === "teacher") {
        await db.teacher.delete({ where: { id: deleteRequest.entityId } });
      } else if (deleteRequest.entityType === "student") {
        await db.student.delete({ where: { id: deleteRequest.entityId } });
      }
    }

    // Notify the requesting manager
    try {
      const statusText = action === "APPROVED" ? "approved" : "rejected";

      // Create in-app notification for the manager
      await db.appNotification.create({
        data: {
          userId: deleteRequest.requestedBy,
          type: action === "APPROVED" ? "delete_approved" : "delete_rejected",
          title: `Delete Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          body: `Your request to delete ${deleteRequest.entityType} "${deleteRequest.entityName}" was ${statusText}.`,
          isRead: false,
          data: {
            entityType: deleteRequest.entityType,
            entityId: deleteRequest.entityId,
            deleteRequestId: id,
          },
        },
      });

      // Send web push to the manager
      const managerSubs = await db.pushSubscription.findMany({
        where: { userId: deleteRequest.requestedBy },
      });

      if (managerSubs.length > 0) {
        const payload = JSON.stringify({
          title: `Delete Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          body: `Your request to delete ${deleteRequest.entityType} "${deleteRequest.entityName}" was ${statusText}.`,
          type: action === "APPROVED" ? "delete_approved" : "delete_rejected",
        });

        const webpush = (await import("web-push")).default;
        const PUBLIC_KEY = process.env.NEXT_PUBLIC_PUBLIC_KEY || "";
        const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY || "";
        const VAPID_EMAIL =
          process.env.VAPID_EMAIL || "mailto:admin@yourdomain.com";

        if (PUBLIC_KEY && PRIVATE_KEY) {
          webpush.setVapidDetails(VAPID_EMAIL, PUBLIC_KEY, PRIVATE_KEY);
          for (const sub of managerSubs) {
            try {
              const keys = sub.keys as { p256dh?: string; auth?: string };
              if (keys?.p256dh && keys?.auth) {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: keys.p256dh, auth: keys.auth },
                  },
                  payload,
                );
              }
            } catch (pushErr) {
              console.error("Push failed for manager:", pushErr);
            }
          }
        }
      }
    } catch (notifyErr) {
      console.error("Notification failed (non-blocking):", notifyErr);
    }

    return NextResponse.json({ ok: true, data: deleteRequest });
  } catch (e) {
    console.error("Failed to update delete request:", e);
    return NextResponse.json(
      { error: "Failed to update delete request" },
      { status: 500 },
    );
  }
}

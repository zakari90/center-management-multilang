/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-side utility to trigger notifications to admin users.
 * Call these functions after successful server sync operations.
 */

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BASE_URL || "";

export type NotificationType =
  | "new_user"
  | "payment"
  | "delete_request"
  | "delete_approved"
  | "delete_rejected";

interface NotifyAdminParams {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send a notification to all admin users who have the relevant preference enabled.
 * This calls the /api/send-push endpoint and creates in-app notifications.
 */
export async function notifyAdmin(params: NotifyAdminParams): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        role: "ADMIN",
        type: params.type,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send admin push notification");
    }
  } catch (error) {
    console.error("notifyAdmin failed:", error);
  }
}

/**
 * Send a notification to a specific user (e.g., manager).
 */
export async function notifyUser(
  userId: string,
  params: NotifyAdminParams,
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        userId,
        type: params.type,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send user push notification");
    }
  } catch (error) {
    console.error("notifyUser failed:", error);
  }
}

// ==================== CONVENIENCE FUNCTIONS ====================

/** Notify admin when a manager creates a new teacher or student */
export async function notifyNewUserCreated(
  entityType: "teacher" | "student",
  entityName: string,
  managerName: string,
): Promise<void> {
  await notifyAdmin({
    type: "new_user",
    title: `New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
    body: `${managerName} added ${entityType}: ${entityName}`,
    data: { entityType, entityName, managerName },
  });
}

/** Notify admin when a payment is recorded */
export async function notifyPaymentRecorded(
  amount: number,
  payerName: string,
  paymentType: "student" | "teacher",
  managerName: string,
): Promise<void> {
  await notifyAdmin({
    type: "payment",
    title: "Payment Recorded",
    body: `${managerName} recorded ${amount} MAD ${paymentType} payment for ${payerName}`,
    data: { amount, payerName, paymentType, managerName },
  });
}

/** Notify manager when their delete request is resolved */
export async function notifyDeleteRequestResolved(
  managerId: string,
  entityType: string,
  entityName: string,
  approved: boolean,
): Promise<void> {
  const status = approved ? "approved" : "rejected";
  await notifyUser(managerId, {
    type: approved ? "delete_approved" : "delete_rejected",
    title: `Delete Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    body: `Your request to delete ${entityType} "${entityName}" was ${status}.`,
    data: { entityType, entityName },
  });
}
/** Notify admin when a manager requests a delete */
export async function notifyNewDeleteRequest(
  managerName: string,
  entityType: string,
  entityName: string,
  reason?: string,
): Promise<void> {
  await notifyAdmin({
    type: "delete_request",
    title: "Delete Request Received",
    body: `${managerName} requested to delete ${entityType} "${entityName}"${reason ? `: ${reason}` : ""}`,
    data: { entityType, entityName, managerName },
  });
}

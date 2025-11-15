/* eslint-disable @typescript-eslint/no-explicit-any */
// receiptServerAction.ts

import { receiptActions } from "./dexieActions";
import { Receipt, ReceiptType } from "./dbSchema";
import { isOnline } from "../utils/network";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
const studentPaymentUrl = `${baseUrl}/api/receipts/student-payment`;
const teacherPaymentUrl = `${baseUrl}/api/receipts/teacher-payment`;

// ✅ Transform server receipt data to match local Receipt interface
function transformServerReceipt(serverReceipt: any): Receipt {
  return {
    id: serverReceipt.id,
    receiptNumber: serverReceipt.receiptNumber,
    amount: serverReceipt.amount,
    type: serverReceipt.type as ReceiptType,
    description: serverReceipt.description || undefined,
    paymentMethod: serverReceipt.paymentMethod || undefined,
    date: typeof serverReceipt.date === 'string'
      ? new Date(serverReceipt.date).getTime()
      : serverReceipt.date || Date.now(),
    studentId: serverReceipt.studentId || undefined,
    teacherId: serverReceipt.teacherId || undefined,
    managerId: serverReceipt.managerId,
    status: '1' as const, // Imported receipts are synced
    createdAt: typeof serverReceipt.createdAt === 'string'
      ? new Date(serverReceipt.createdAt).getTime()
      : serverReceipt.createdAt || Date.now(),
    updatedAt: typeof serverReceipt.updatedAt === 'string'
      ? new Date(serverReceipt.updatedAt).getTime()
      : serverReceipt.updatedAt || Date.now(),
  };
}

const ServerActionReceipts = {
  // ✅ Create new receipt on server (student payment)
  async CreateStudentPaymentOnServer(receipt: Receipt, subjectIds: string[]) {
    try {
      const response = await fetch(studentPaymentUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
        body: JSON.stringify({
          studentId: receipt.studentId,
          subjectIds: subjectIds,
          paymentMethod: receipt.paymentMethod,
          description: receipt.description,
          date: new Date(receipt.date).toISOString().split('T')[0],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating student payment on server:", e);
      return null;
    }
  },

  // ✅ Create new receipt on server (teacher payment)
  async CreateTeacherPaymentOnServer(receipt: Receipt) {
    try {
      const response = await fetch(teacherPaymentUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
        body: JSON.stringify({
          teacherId: receipt.teacherId,
          amount: receipt.amount,
          paymentMethod: receipt.paymentMethod,
          description: receipt.description,
          date: new Date(receipt.date).toISOString().split('T')[0],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP Error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }
      return response.json();
    } catch (e) {
      console.error("Error creating teacher payment on server:", e);
      return null;
    }
  },

  // ✅ Note: Receipts are typically not updated, only created
  // If update is needed, it would go here

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${baseUrl}/api/receipts/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
      });
      return response;
    } catch (e) {
      console.error("Error deleting receipt from server:", e);
      return null;
    }
  },

  async Sync() {
    // ✅ Check if online before syncing
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    // Get all receipts with status "w" (waiting) or "0" (pending deletion)
    const waitingData = await receiptActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No receipts to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const receipt of waitingData) {
      try {
        if (receipt.status === "0") {
          // ✅ Pending deletion: remove on server and then local
          const result = await ServerActionReceipts.DeleteFromServer(receipt.id);
          if (result && result.ok) {
            await receiptActions.deleteLocal(receipt.id);
            results.push({ id: receipt.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: receipt.id, success: false, error: errorMsg });
          }
        } else if (receipt.status === "w") {
          // ✅ Waiting to sync: create receipt on server
          // Note: Receipts need subjectIds for student payments, which we don't store in receipt
          // This is a limitation - we may need to store subjectIds in receipt or handle differently
          let result;
          
          if (receipt.type === 'STUDENT_PAYMENT' && receipt.studentId) {
            // For student payments, we need subjectIds - this is a limitation
            // In a real implementation, you might store subjectIds in the receipt or fetch them
            result = null; // Cannot create without subjectIds
            results.push({ id: receipt.id, success: false, error: "Student payment requires subjectIds" });
          } else if (receipt.type === 'TEACHER_PAYMENT' && receipt.teacherId) {
            result = await ServerActionReceipts.CreateTeacherPaymentOnServer(receipt);
          } else {
            result = null;
            results.push({ id: receipt.id, success: false, error: "Invalid receipt type or missing required fields" });
          }

          if (result) {
            // ✅ Mark as synced if server accepted
            await receiptActions.markSynced(receipt.id);
            // ✅ Update local receipt with server response data if available
            if (result.id) {
              await receiptActions.putLocal({
                ...receipt,
                ...(result.id && { id: result.id }),
                ...(result.receiptNumber && { receiptNumber: result.receiptNumber }),
                ...(result.amount !== undefined && { amount: result.amount }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            }
            results.push({ id: receipt.id, success: true });
          }
        }
      } catch (error) {
        // ✅ Continue with next receipt instead of stopping
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing receipt ${receipt.id}:`, error);
        results.push({ id: receipt.id, success: false, error: errorMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      message: `Receipt sync completed. ${successCount} succeeded, ${failCount} failed.`,
      results,
      successCount,
      failCount,
    };
  },

  async ReadFromServer() {
    try {
      const res = await fetch(`${baseUrl}/api/receipts`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Include cookies for session authentication
      });
      if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
      return res.json();
    } catch (e) {
      console.error("Error reading from server:", e);
      throw e;
    }
  },

  async ImportFromServer() {
    // ✅ Check if online before importing
    if (!isOnline()) {
      throw new Error("Cannot import: device is offline");
    }

    try {
      const data = await ServerActionReceipts.ReadFromServer();
      
      // ✅ Store synced receipts as backup before deletion
      const syncedReceipts = await receiptActions.getByStatus(["1"]);
      const backup = [...syncedReceipts];
      
      try {
        // ✅ Delete all synced receipts to avoid duplicates
        for (const receipt of syncedReceipts) {
          await receiptActions.deleteLocal(receipt.id);
        }
        
        // ✅ Insert all receipts from server with proper transformation
        // ✅ Preserve local 'w' status data - don't overwrite pending local changes
        const transformedReceipts = Array.isArray(data) 
          ? data.map((receipt: any) => transformServerReceipt(receipt))
          : [];
        for (const receipt of transformedReceipts) {
          // Check if local receipt exists with 'w' status - preserve it
          const existing = await receiptActions.getLocal(receipt.id);
          if (existing && existing.status === 'w') {
            // Don't overwrite local pending changes
            continue;
          }
          await receiptActions.putLocal(receipt);
        }
        
        return { message: `Imported ${transformedReceipts.length} receipts from server.`, count: transformedReceipts.length };
      } catch (error) {
        // ✅ Restore backup on failure
        console.error("Error during import, restoring backup:", error);
        for (const receipt of backup) {
          await receiptActions.putLocal(receipt);
        }
        throw new Error("Import failed, local data restored. Error: " + (error instanceof Error ? error.message : "Unknown"));
      }
    } catch (error) {
      console.error("Error importing from server:", error);
      throw error;
    }
  }
};

export default ServerActionReceipts;


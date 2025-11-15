/* eslint-disable @typescript-eslint/no-explicit-any */
// receiptServerAction.ts

import { receiptActions, studentSubjectActions, teacherSubjectActions } from "./dexieActions";
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
    status: '1' as const,
    createdAt: typeof serverReceipt.createdAt === 'string'
      ? new Date(serverReceipt.createdAt).getTime()
      : serverReceipt.createdAt || Date.now(),
    updatedAt: typeof serverReceipt.updatedAt === 'string'
      ? new Date(serverReceipt.updatedAt).getTime()
      : serverReceipt.updatedAt || Date.now(),
  };
}

const ServerActionReceipts = {
  // ✅ Save receipt to server
  async SaveToServer(receipt: Receipt) {
    try {
      if (receipt.type === ReceiptType.STUDENT_PAYMENT && receipt.studentId) {
        // Fetch subjectIds from studentSubjects
        const studentSubjects = await studentSubjectActions.getAll();
        const relevantSubjects = studentSubjects.filter(
          ss => ss.studentId === receipt.studentId && ss.status !== '0'
        );
        const subjectIds = relevantSubjects.map(ss => ss.subjectId);

        if (subjectIds.length === 0) {
          throw new Error("No subjects found for student payment");
        }

        const response = await fetch(studentPaymentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
      } else if (receipt.type === ReceiptType.TEACHER_PAYMENT && receipt.teacherId) {
        // Fetch subjectIds from teacherSubjects
        const teacherSubjects = await teacherSubjectActions.getAll();
        const relevantSubjects = teacherSubjects.filter(
          ts => ts.teacherId === receipt.teacherId && ts.status !== '0'
        );
        const subjectIds = relevantSubjects.map(ts => ts.subjectId);

        if (subjectIds.length === 0) {
          throw new Error("No subjects found for teacher payment");
        }

        const response = await fetch(teacherPaymentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            teacherId: receipt.teacherId,
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
      } else {
        throw new Error("Invalid receipt type or missing required fields");
      }
    } catch (e) {
      console.error("Error saving receipt to server:", e);
      return null;
    }
  },

  async DeleteFromServer(id: string) {
    try {
      const response = await fetch(`${baseUrl}/api/receipts/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return response;
    } catch (e) {
      console.error("Error deleting receipt from server:", e);
      return null;
    }
  },

  async Sync() {
    if (!isOnline()) {
      throw new Error("Cannot sync: device is offline");
    }

    const waitingData = await receiptActions.getByStatus(["0", "w"]);
    if (waitingData.length === 0) return { message: "No receipts to sync.", results: [] };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const receipt of waitingData) {
      try {
        if (receipt.status === "0") {
          // Pending deletion
          const result = await ServerActionReceipts.DeleteFromServer(receipt.id);
          if (result && result.ok) {
            await receiptActions.deleteLocal(receipt.id);
            results.push({ id: receipt.id, success: true });
          } else {
            const errorMsg = result ? `Server returned ${result.status}` : "Network error";
            results.push({ id: receipt.id, success: false, error: errorMsg });
          }
        } else if (receipt.status === "w") {
          // Waiting to sync
          const result = await ServerActionReceipts.SaveToServer(receipt);
          if (result) {
            receipt.status = "1"; // Mark as synced
            await receiptActions.putLocal({
              ...receipt,
              ...(result.id && { id: result.id }),
              ...(result.receiptNumber && { receiptNumber: result.receiptNumber }),
              ...(result.amount !== undefined && { amount: result.amount }),
              status: '1' as const,
              updatedAt: Date.now(),
            });
            results.push({ id: receipt.id, success: true });
          } else {
            results.push({ id: receipt.id, success: false, error: "Server request failed" });
          }
        }
      } catch (error) {
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
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
      return res.json();
    } catch (e) {
      console.error("Error reading from server:", e);
      throw e;
    }
  },

  async ImportFromServer() {
    if (!isOnline()) {
      throw new Error("Cannot import: device is offline");
    }

    try {
      const data = await ServerActionReceipts.ReadFromServer();
      const syncedReceipts = await receiptActions.getByStatus(["1"]);
      const backup = [...syncedReceipts];
      
      try {
        for (const receipt of syncedReceipts) {
          await receiptActions.deleteLocal(receipt.id);
        }
        
        const transformedReceipts = Array.isArray(data) 
          ? data.map((receipt: any) => transformServerReceipt(receipt))
          : [];
        for (const receipt of transformedReceipts) {
          const existing = await receiptActions.getLocal(receipt.id);
          if (existing && existing.status === 'w') {
            continue; // Don't overwrite local pending changes
          }
          await receiptActions.putLocal(receipt);
        }
        
        return { message: `Imported ${transformedReceipts.length} receipts from server.`, count: transformedReceipts.length };
      } catch (error) {
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

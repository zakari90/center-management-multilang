import {
  centerActions,
  receiptActions,
  studentActions,
  teacherActions,
  studentSubjectActions,
  subjectActions,
} from "@/freelib/dexie/freedexieaction";
import {
  checkPaymentStatus,
  getAcademicYearPeriods,
  getStudentPaymentStatusForPeriod,
  PaymentStatus,
} from "@/freelib/payment-utils";
import { ReceiptType } from "@/freelib/dexie/dbSchema";

export const paymentService = {
  /**
   * Check payment status for a specific student
   */
  async checkStudentPaymentStatus(
    studentId: string,
    centerId: string,
  ): Promise<PaymentStatus> {
    const center = await centerActions.getLocal(centerId);
    if (!center) {
      throw new Error("Center not found");
    }

    const allReceipts = await receiptActions.getAll();
    const studentReceipts = allReceipts.filter(
      (r) =>
        r.studentId === studentId && r.type === ReceiptType.STUDENT_PAYMENT,
    );

    return checkPaymentStatus(
      studentReceipts,
      center.paymentStartDay || 1,
      center.paymentEndDay || 30,
    );
  },

  /**
   * Check payment status for a specific teacher
   */
  async checkTeacherPaymentStatus(
    teacherId: string,
    centerId: string,
  ): Promise<PaymentStatus> {
    const center = await centerActions.getLocal(centerId);
    if (!center) {
      throw new Error("Center not found");
    }

    const allReceipts = await receiptActions.getAll();
    const teacherReceipts = allReceipts.filter(
      (r) =>
        r.teacherId === teacherId && r.type === ReceiptType.TEACHER_PAYMENT,
    );

    return checkPaymentStatus(
      teacherReceipts,
      center.paymentStartDay || 1,
      center.paymentEndDay || 30,
    );
  },

  /**
   * Get student's payment status for the whole academic year
   */
  async getStudentAcademicYearStatus(studentId: string, centerId: string) {
    const center = await centerActions.getLocal(centerId);
    if (!center) {
      throw new Error("Center not found");
    }

    const allReceipts = await receiptActions.getAll();
    const studentReceipts = allReceipts.filter(
      (r) =>
        r.studentId === studentId && r.type === ReceiptType.STUDENT_PAYMENT,
    );

    const allStudentSubjects = await studentSubjectActions.getAll();
    const activeStudentSubjects = allStudentSubjects.filter(
      (ss) => ss.studentId === studentId,
    );

    const allSubjects = await subjectActions.getAll();
    const targetAmount = activeStudentSubjects.reduce((sum: number, ss) => {
      const subject = allSubjects.find((s) => s.id === ss.subjectId);
      return sum + (subject?.price || 0);
    }, 0);

    const periods = getAcademicYearPeriods(
      center.paymentStartDay || 1,
      center.paymentEndDay || 30,
      center.academicYear || "2025-2026",
    );

    return periods.map((period) => {
      const status = getStudentPaymentStatusForPeriod(
        studentReceipts,
        period,
        targetAmount,
      );
      return {
        ...status,
        month: period.start.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      };
    });
  },
};

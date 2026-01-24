import { describe, it, expect } from "vitest";
import {
  getAcademicYearPeriods,
  getStudentPaymentStatusForPeriod,
} from "../src/lib/payment-utils";

describe("Payment Utilities - Academic Year", () => {
  it("should generate 10 periods for the academic year (Sep-Jun)", () => {
    const periods = getAcademicYearPeriods(1, 30, "2025-2026");
    expect(periods).toHaveLength(10);

    // First period should be Sep 2025
    expect(periods[0].start.getMonth()).toBe(8); // September
    expect(periods[0].start.getFullYear()).toBe(2025);

    // Last period should be June 2026
    expect(periods[9].start.getMonth()).toBe(5); // June
    expect(periods[9].start.getFullYear()).toBe(2026);
  });

  it("should correctly identify PAID status with receipts", () => {
    const period = {
      start: new Date(2025, 8, 1),
      end: new Date(2025, 8, 30),
    };

    const receipts = [
      { amount: 100, date: new Date(2025, 8, 15).getTime(), status: "1" },
    ];

    const status = getStudentPaymentStatusForPeriod(receipts, period, 100);
    expect(status.status).toBe("PAID");
    expect(status.isPaid).toBe(true);
  });

  it("should correctly identify PARTIAL status", () => {
    const period = {
      start: new Date(2025, 8, 1),
      end: new Date(2025, 8, 30),
    };

    const receipts = [
      { amount: 50, date: new Date(2025, 8, 15).getTime(), status: "1" },
    ];

    const status = getStudentPaymentStatusForPeriod(receipts, period, 100);
    expect(status.status).toBe("PARTIAL");
  });

  it("should correctly identify UNPAID status", () => {
    const period = {
      start: new Date(2025, 8, 1),
      end: new Date(2025, 8, 30),
    };

    const status = getStudentPaymentStatusForPeriod([], period, 100);
    expect(status.status).toBe("UNPAID");
  });
});

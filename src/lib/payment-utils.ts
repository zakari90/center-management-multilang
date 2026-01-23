import {
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";

export interface PaymentPeriod {
  start: Date;
  end: Date;
}

export interface PaymentStatus {
  isPaid: boolean;
  amountPaid: number;
  period: PaymentPeriod;
  status: "PAID" | "PARTIAL" | "UNPAID";
}

/**
 * Calculates the current payment period based on today's date and the center's configuration.
 *
 * @param paymentStartDay The day of the month when the payment period starts
 * @param paymentEndDay The day of the month when the payment period ends
 * @param date Optional date to check for (defaults to today)
 * @returns Object containing start and end dates of the period
 */
export function getPaymentPeriod(
  paymentStartDay: number = 1,
  paymentEndDay: number = 30,
  date: Date = new Date(),
): PaymentPeriod {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();

  let start: Date;
  let end: Date;

  // Case 1: Standard month (e.g., 1st to 30th)
  if (paymentStartDay < paymentEndDay) {
    // If today is before start day (e.g., today 5th, start 10th), we are in previous period?
    // Usually standard period covers the whole month approx.
    // Let's assume if Today is Jan 15, and Period is 1-30, it is Jan 1-30.

    start = new Date(currentYear, currentMonth, paymentStartDay);
    end = new Date(currentYear, currentMonth, paymentEndDay);

    // If today is NOT within this range (unlikely if covered fully, but maybe if today is 31st and end is 30th?)
    // If today is 31st, and end is 30th, are we in next period?
    // For standard cycle, let's keep it simple: It belongs to the current month's cycle.
  } else {
    // Case 2: Cross-month (e.g., 25th to 24th)
    // If today is Jan 15, range is roughly Dec 25 - Jan 24.
    // If today is Jan 26, range is Jan 25 - Feb 24.

    if (currentDay >= paymentStartDay) {
      // We are in the start of the cycle (e.g. Jan 26 > Jan 25)
      // Cycle is Jan 25 - Feb 24
      start = new Date(currentYear, currentMonth, paymentStartDay);
      end = new Date(currentYear, currentMonth + 1, paymentEndDay);
    } else {
      // We are in the end of the cycle (e.g. Jan 15 < Jan 25)
      // Cycle is Dec 25 - Jan 24
      start = new Date(currentYear, currentMonth - 1, paymentStartDay);
      end = new Date(currentYear, currentMonth, paymentEndDay);
    }
  }

  return {
    start: startOfDay(start),
    end: endOfDay(end),
  };
}

/**
 * Checks if an entity has paid for the current period.
 *
 * @param receipts List of receipts to check
 * @param paymentStartDay Center's payment start day
 * @param paymentEndDay Center's payment end day
 * @param targetAmount Optional target amount to be considered "fully paid"
 * @returns PaymentStatus object
 */
export function checkPaymentStatus(
  receipts: any[],
  paymentStartDay: number,
  paymentEndDay: number,
  targetAmount?: number,
): PaymentStatus {
  const period = getPaymentPeriod(paymentStartDay, paymentEndDay);

  const relevantReceipts = receipts.filter((receipt) => {
    const receiptDate = new Date(receipt.date || receipt.createdAt);
    return (
      (isAfter(receiptDate, period.start) ||
        isSameDay(receiptDate, period.start)) &&
      (isBefore(receiptDate, period.end) || isSameDay(receiptDate, period.end))
    );
  });

  const amountPaid = relevantReceipts.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );

  let status: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";

  if (amountPaid > 0) {
    if (targetAmount && amountPaid < targetAmount) {
      status = "PARTIAL";
    } else {
      status = "PAID";
    }
  }

  return {
    isPaid: status === "PAID",
    amountPaid,
    period,
    status,
  };
}

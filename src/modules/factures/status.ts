import type { InvoiceStatus } from "@prisma/client";

export function computeInvoiceStatus(
  amount: number,
  amountPaid: number,
  dueAt: Date,
  explicitStatus?: InvoiceStatus,
): InvoiceStatus {
  if (explicitStatus === "cancelled") {
    return "cancelled";
  }

  if (amountPaid >= amount) {
    return "paid";
  }

  if (amountPaid > 0) {
    return "partially_paid";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueAt);
  due.setHours(0, 0, 0, 0);

  if (due < today) {
    return "overdue";
  }

  return "upcoming";
}

export function decimalToNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

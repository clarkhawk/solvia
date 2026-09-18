import { describe, it, expect } from "vitest";
import { computeInvoiceStatus } from "../status";

describe("computeInvoiceStatus", () => {
  const future = new Date();
  future.setDate(future.getDate() + 30);

  const past = new Date();
  past.setDate(past.getDate() - 10);

  it("returns paid when fully paid", () => {
    expect(computeInvoiceStatus(100, 100, future)).toBe("paid");
  });

  it("returns partially_paid when partially paid", () => {
    expect(computeInvoiceStatus(100, 50, future)).toBe("partially_paid");
  });

  it("returns overdue when unpaid and past due", () => {
    expect(computeInvoiceStatus(100, 0, past)).toBe("overdue");
  });

  it("returns upcoming when unpaid and not yet due", () => {
    expect(computeInvoiceStatus(100, 0, future)).toBe("upcoming");
  });

  it("respects cancelled status", () => {
    expect(computeInvoiceStatus(100, 0, future, "cancelled")).toBe("cancelled");
  });
});

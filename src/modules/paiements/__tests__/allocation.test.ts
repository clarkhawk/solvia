import { describe, it, expect } from "vitest";

describe("FIFO allocation logic", () => {
  it("allocates to oldest invoice first", () => {
    const invoices = [
      { id: "inv-1", amountRemaining: 100, amountPaid: 0, dueAt: new Date("2025-01-01") },
      { id: "inv-2", amountRemaining: 200, amountPaid: 0, dueAt: new Date("2025-02-01") },
    ].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

    let remaining = 150;
    const allocations: Array<{ invoiceId: string; amount: number }> = [];

    for (const invoice of invoices) {
      if (remaining <= 0) break;
      const allocated = Math.min(remaining, invoice.amountRemaining);
      if (allocated > 0) {
        allocations.push({ invoiceId: invoice.id, amount: allocated });
        remaining -= allocated;
      }
    }

    expect(allocations).toEqual([
      { invoiceId: "inv-1", amount: 100 },
      { invoiceId: "inv-2", amount: 50 },
    ]);
    expect(remaining).toBe(0);
  });
});

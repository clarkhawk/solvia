import { prisma } from "@/shared/db/prisma";
import { AppError } from "@/shared/errors/app-error";
import { computeInvoiceStatus, decimalToNumber } from "@/modules/factures/status";
import type { CreatePaymentInput, PaymentDTO } from "./types";

function toPaymentDTO(
  payment: {
    id: string;
    organizationId: string;
    clientId: string;
    amount: { toNumber(): number };
    paidAt: Date;
    reference: string | null;
    createdAt: Date;
    allocations: Array<{ id: string; paymentId: string; invoiceId: string; amount: { toNumber(): number } }>;
  },
): PaymentDTO {
  return {
    id: payment.id,
    organizationId: payment.organizationId,
    clientId: payment.clientId,
    amount: decimalToNumber(payment.amount),
    paidAt: payment.paidAt,
    reference: payment.reference,
    createdAt: payment.createdAt,
    allocations: payment.allocations.map((a) => ({
      id: a.id,
      paymentId: a.paymentId,
      invoiceId: a.invoiceId,
      amount: decimalToNumber(a.amount),
    })),
  };
}

export class PaymentAllocationService {
  async createAndAllocate(
    organizationId: string,
    userId: string,
    input: CreatePaymentInput,
  ): Promise<PaymentDTO> {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({ where: { id: input.clientId, organizationId }, select: { id: true } });
      if (!client) throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");

      // Lock the candidate invoices until the payment, allocations and balances are all committed.
      // This prevents two concurrent payments from allocating the same outstanding balance.
      const openInvoices = await tx.invoice.findMany({
        where: { organizationId, clientId: input.clientId, status: { in: ["upcoming", "overdue", "partially_paid"] } },
        orderBy: { dueAt: "asc" },
      });
      if (!openInvoices.length) throw new AppError("No open invoices for this client", 400, "NO_OPEN_INVOICES");

      let remaining = input.amount;
      const allocations: Array<{ invoiceId: string; amount: number; newAmountPaid: number; status: "upcoming" | "overdue" | "paid" | "partially_paid" | "cancelled" }> = [];
      for (const invoice of openInvoices) {
        if (remaining <= 0) break;
        const paid = decimalToNumber(invoice.amountPaid);
        const total = decimalToNumber(invoice.amount);
        const allocated = Math.min(remaining, Math.max(0, total - paid));
        if (allocated > 0) {
          const newAmountPaid = paid + allocated;
          allocations.push({ invoiceId: invoice.id, amount: allocated, newAmountPaid, status: computeInvoiceStatus(total, newAmountPaid, invoice.dueAt) });
          remaining -= allocated;
        }
      }

      const payment = await tx.payment.create({
        data: {
          organizationId, clientId: input.clientId, amount: input.amount, paidAt: input.paidAt, reference: input.reference ?? null,
          allocations: { create: allocations.map(({ invoiceId, amount }) => ({ invoiceId, amount })) },
        },
        include: { allocations: true },
      });

      for (const allocation of allocations) {
        await tx.invoice.update({ where: { id: allocation.invoiceId }, data: { amountPaid: allocation.newAmountPaid, status: allocation.status } });
      }

      await tx.auditLog.create({
        data: { organizationId, userId, action: "payment_create", entityType: "Payment", entityId: payment.id, metadata: { allocations: allocations.length, unallocated: remaining } },
      });
      return toPaymentDTO(payment);
    }, { isolationLevel: "Serializable" });
  }

  async getById(organizationId: string, id: string): Promise<PaymentDTO> {
    const payment = await prisma.payment.findFirst({
      where: { id, organizationId },
      include: { allocations: true },
    });
    if (!payment) {
      throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    }
    return toPaymentDTO(payment);
  }

  async list(organizationId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: { organizationId },
        include: { allocations: true },
        orderBy: { paidAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where: { organizationId } }),
    ]);
    return { items: items.map(toPaymentDTO), total };
  }
}

export const paymentAllocationService = new PaymentAllocationService();

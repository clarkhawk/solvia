import { prisma } from "@/shared/db/prisma";
import { logAuditEvent } from "@/shared/audit/audit-log";
import { AppError } from "@/shared/errors/app-error";
import { clientRepository } from "@/modules/clients/repository";
import { invoiceRepository } from "@/modules/factures/repository";
import { invoiceService } from "@/modules/factures/service";
import { decimalToNumber } from "@/modules/factures/status";
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
    const client = await clientRepository.findById(organizationId, input.clientId);
    if (!client) {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const openInvoices = await invoiceRepository.findOpenByClient(organizationId, input.clientId);
    if (openInvoices.length === 0) {
      throw new AppError("No open invoices for this client", 400, "NO_OPEN_INVOICES");
    }

    let remaining = input.amount;
    const allocations: Array<{ invoiceId: string; amount: number }> = [];

    for (const invoice of openInvoices) {
      if (remaining <= 0) break;
      const due = invoice.amountRemaining;
      const allocated = Math.min(remaining, due);
      if (allocated > 0) {
        allocations.push({ invoiceId: invoice.id, amount: allocated });
        remaining -= allocated;
      }
    }

    const payment = await prisma.payment.create({
      data: {
        organizationId,
        clientId: input.clientId,
        amount: input.amount,
        paidAt: input.paidAt,
        reference: input.reference ?? null,
        allocations: {
          create: allocations.map((a) => ({
            invoiceId: a.invoiceId,
            amount: a.amount,
          })),
        },
      },
      include: { allocations: true },
    });

    for (const allocation of allocations) {
      const invoice = openInvoices.find((i) => i.id === allocation.invoiceId)!;
      const newAmountPaid = invoice.amountPaid + allocation.amount;
      await invoiceService.updateStatusFromPayment(organizationId, allocation.invoiceId, newAmountPaid);
    }

    await logAuditEvent({
      organizationId,
      userId,
      action: "payment_create",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { allocations: allocations.length, unallocated: remaining },
    });

    return toPaymentDTO(payment);
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

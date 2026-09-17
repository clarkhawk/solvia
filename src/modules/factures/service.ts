import { logAuditEvent } from "@/shared/audit/audit-log";
import { prisma } from "@/shared/db/prisma";
import { AppError } from "@/shared/errors/app-error";
import { clientRepository } from "@/modules/clients/repository";
import { invoiceRepository } from "./repository";
import { computeInvoiceStatus, decimalToNumber } from "./status";
import type { CreateInvoiceInput, InvoiceDTO, InvoiceFilters, UpdateInvoiceInput } from "./types";

export class InvoiceService {
  async getById(organizationId: string, id: string): Promise<InvoiceDTO> {
    const invoice = await invoiceRepository.findById(organizationId, id);
    if (!invoice) {
      throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
    }
    return invoice;
  }

  async list(organizationId: string, page: number, limit: number, filters?: InvoiceFilters) {
    return invoiceRepository.list(organizationId, page, limit, filters);
  }

  async create(organizationId: string, userId: string, input: CreateInvoiceInput): Promise<InvoiceDTO> {
    const client = await clientRepository.findById(organizationId, input.clientId);
    if (!client) {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const status = computeInvoiceStatus(input.amount, 0, input.dueAt);
    const invoice = await invoiceRepository.create(organizationId, input, status);

    await logAuditEvent({
      organizationId,
      userId,
      action: "invoice_create",
      entityType: "Invoice",
      entityId: invoice.id,
    });

    return invoice;
  }

  async update(organizationId: string, userId: string, id: string, input: UpdateInvoiceInput): Promise<InvoiceDTO> {
    const existing = await this.getById(organizationId, id);

    const amount = input.amount ?? existing.amount;
    if (amount < existing.amountPaid) {
      throw new AppError(
        "Invoice amount cannot be lower than the amount already paid",
        400,
        "AMOUNT_BELOW_PAID",
      );
    }
    const dueAt = input.dueAt ?? existing.dueAt;
    const status = computeInvoiceStatus(amount, existing.amountPaid, dueAt, input.status);

    const invoice = await invoiceRepository.update(organizationId, id, {
      ...input,
      status,
    });

    await logAuditEvent({
      organizationId,
      userId,
      action: "invoice_update",
      entityType: "Invoice",
      entityId: invoice.id,
    });

    return invoice;
  }

  async updateStatusFromPayment(
    organizationId: string,
    invoiceId: string,
    amountPaid: number,
  ): Promise<InvoiceDTO> {
    const existing = await this.getById(organizationId, invoiceId);
    const status = computeInvoiceStatus(existing.amount, amountPaid, existing.dueAt);
    return invoiceRepository.updateAmountPaid(organizationId, invoiceId, amountPaid, status);
  }

  async delete(organizationId: string, userId: string, id: string): Promise<void> {
    await this.getById(organizationId, id);
    await invoiceRepository.delete(organizationId, id);

    await logAuditEvent({
      organizationId,
      userId,
      action: "invoice_delete",
      entityType: "Invoice",
      entityId: id,
    });
  }

  async getDashboardSummary(organizationId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [statusGroups, priorityInvoices, monthPayments, organization] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
        _sum: { amount: true, amountPaid: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId, status: { in: ["overdue", "partially_paid", "upcoming"] } },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 6,
      }),
      prisma.payment.aggregate({
        where: { organizationId, paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.organization.findUnique({ where: { id: organizationId }, select: { currency: true } }),
    ]);

    const byStatus = Object.fromEntries(
      statusGroups.map((group) => [
        group.status,
        {
          count: group._count._all,
          amount: decimalToNumber(group._sum.amount ?? 0),
          paid: decimalToNumber(group._sum.amountPaid ?? 0),
        },
      ]),
    ) as Record<string, { count: number; amount: number; paid: number }>;

    const activeStatuses = ["upcoming", "overdue", "partially_paid", "paid"];
    const totals = activeStatuses.reduce(
      (summary, status) => {
        const group = byStatus[status] ?? { count: 0, amount: 0, paid: 0 };
        return {
          invoiceAmount: summary.invoiceAmount + group.amount,
          paidAmount: summary.paidAmount + group.paid,
        };
      },
      { invoiceAmount: 0, paidAmount: 0 },
    );
    const outstandingAmount = Math.max(0, totals.invoiceAmount - totals.paidAmount);

    return {
      currency: organization?.currency ?? "EUR",
      counts: {
        upcoming: byStatus.upcoming?.count ?? 0,
        overdue: byStatus.overdue?.count ?? 0,
        paid: byStatus.paid?.count ?? 0,
        partiallyPaid: byStatus.partially_paid?.count ?? 0,
      },
      amounts: {
        outstanding: outstandingAmount,
        overdue: Math.max(0, (byStatus.overdue?.amount ?? 0) - (byStatus.overdue?.paid ?? 0)),
        collectedThisMonth: decimalToNumber(monthPayments._sum.amount ?? 0),
        collectionRate: totals.invoiceAmount > 0 ? Math.round((totals.paidAmount / totals.invoiceAmount) * 100) : 0,
      },
      distribution: activeStatuses.map((status) => ({
        status,
        amount: Math.max(0, (byStatus[status]?.amount ?? 0) - (byStatus[status]?.paid ?? 0)),
        count: byStatus[status]?.count ?? 0,
      })),
      priorityInvoices: priorityInvoices.map((invoice) => ({
        id: invoice.id,
        reference: invoice.reference,
        amount: decimalToNumber(invoice.amount),
        amountRemaining: Math.max(0, decimalToNumber(invoice.amount) - decimalToNumber(invoice.amountPaid)),
        dueAt: invoice.dueAt,
        status: invoice.status,
      })),
    };
  }
}

export const invoiceService = new InvoiceService();

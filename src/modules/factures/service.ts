import { logAuditEvent } from "@/shared/audit/audit-log";
import { AppError } from "@/shared/errors/app-error";
import { clientRepository } from "@/modules/clients/repository";
import { invoiceRepository } from "./repository";
import { computeInvoiceStatus } from "./status";
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
    const [upcoming, overdue, paid, partiallyPaid] = await Promise.all([
      invoiceRepository.list(organizationId, 1, 1, { status: "upcoming" }),
      invoiceRepository.list(organizationId, 1, 1, { status: "overdue" }),
      invoiceRepository.list(organizationId, 1, 1, { status: "paid" }),
      invoiceRepository.list(organizationId, 1, 1, { status: "partially_paid" }),
    ]);

    const dueSoon = await invoiceRepository.list(organizationId, 1, 10, { status: "upcoming" });

    return {
      counts: {
        upcoming: upcoming.total,
        overdue: overdue.total,
        paid: paid.total,
        partiallyPaid: partiallyPaid.total,
      },
      dueSoon: dueSoon.items,
    };
  }
}

export const invoiceService = new InvoiceService();

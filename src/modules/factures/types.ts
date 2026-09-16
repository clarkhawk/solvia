import type { InvoiceStatus } from "@prisma/client";

export interface InvoiceDTO {
  id: string;
  organizationId: string;
  clientId: string;
  reference: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  issuedAt: Date;
  dueAt: Date;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceInput {
  clientId: string;
  reference: string;
  amount: number;
  issuedAt: Date;
  dueAt: Date;
}

export interface UpdateInvoiceInput {
  reference?: string;
  amount?: number;
  issuedAt?: Date;
  dueAt?: Date;
  status?: InvoiceStatus;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

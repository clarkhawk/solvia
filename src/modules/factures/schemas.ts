import { z } from "zod";

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  reference: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  issuedAt: z.coerce.date(),
  dueAt: z.coerce.date(),
});

export const updateInvoiceSchema = z.object({
  reference: z.string().min(1).max(100).optional(),
  amount: z.coerce.number().positive().optional(),
  issuedAt: z.coerce.date().optional(),
  dueAt: z.coerce.date().optional(),
  status: z.enum(["upcoming", "overdue", "paid", "partially_paid", "cancelled"]).optional(),
});

export const listInvoicesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["upcoming", "overdue", "paid", "partially_paid", "cancelled"]).optional(),
  clientId: z.string().uuid().optional(),
});

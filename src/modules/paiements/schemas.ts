import { z } from "zod";

export const createPaymentSchema = z.object({
  clientId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  paidAt: z.coerce.date(),
  reference: z.string().max(100).optional(),
});

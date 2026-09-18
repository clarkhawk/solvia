import { z } from "zod";

export const createRelanceSchema = z.object({
  invoiceId: z.string().uuid(),
  channel: z.enum(["whatsapp", "phone", "email"]),
  level: z.enum(["friendly", "reminder_1", "reminder_2", "final_notice"]),
  result: z
    .enum(["response_received", "payment_promise", "to_follow_up", "payment_received", "no_response"])
    .optional(),
});

export const updateRelanceSchema = z.object({
  channel: z.enum(["whatsapp", "phone", "email"]).optional(),
  level: z.enum(["friendly", "reminder_1", "reminder_2", "final_notice"]).optional(),
  result: z
    .enum(["response_received", "payment_promise", "to_follow_up", "payment_received", "no_response"])
    .optional(),
  messageDraft: z.string().optional(),
  sentAt: z.coerce.date().nullable().optional(),
});

import { z } from "zod";

export const upsertAIConfigSchema = z.object({
  provider: z.enum(["openai", "gemini", "anthropic", "grok"]),
  apiKey: z.string().min(10),
});

export const generateMessageSchema = z.object({
  channel: z.enum(["whatsapp", "phone", "email"]),
  level: z.enum(["friendly", "reminder_1", "reminder_2", "final_notice"]),
  invoiceId: z.string().uuid(),
  tone: z.string().max(200).optional(),
});

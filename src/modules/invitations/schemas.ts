import { z } from "zod";

export const invitationRoleSchema = z.enum(["dirigeant", "comptable", "commercial"]);

export const createInvitationSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  role: invitationRoleSchema,
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(8).max(128),
});

export const invitationTokenSchema = z.string().min(32).max(200);

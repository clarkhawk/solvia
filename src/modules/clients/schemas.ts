import { z } from "zod";

export const clientIdentitySchema = z.object({
  name: z.string().min(1).max(200),
  companyName: z.string().max(200).optional(),
  siret: z.string().max(20).optional(),
});

export const clientContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
});

export const createClientSchema = z.object({
  externalCode: z.string().max(100).optional(),
  identity: clientIdentitySchema,
  contact: clientContactSchema,
});

export const updateClientSchema = z.object({
  externalCode: z.string().max(100).nullable().optional(),
  identity: clientIdentitySchema.optional(),
  contact: clientContactSchema.optional(),
});

export const listClientsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

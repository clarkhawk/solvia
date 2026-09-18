import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { jsonOk, withAuth } from "@/shared/api/handler";
import { SUPPORTED_CURRENCIES } from "@/shared/currencies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paramètres de l'organisation : nom, devise de facturation, fuseau, seuil de risque.
 *
 * @route GET /api/v1/organization
 */
export const GET = withAuth("invoices:read", async (ctx) => {
  const organization = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { id: true, name: true, currency: true, timezone: true, riskThreshold: true },
  });

  return jsonOk(organization);
});

const updateSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    timezone: z.string().min(3).max(64).optional(),
  })
  .strict();

/**
 * Met à jour les paramètres de l'organisation.
 * La devise s'applique à l'affichage de toutes les factures : elle ne convertit
 * aucun montant déjà enregistré.
 *
 * @route PATCH /api/v1/organization
 */
export const PATCH = withAuth("organization:manage", async (ctx, request) => {
  const input = updateSchema.parse(await request.json());

  const organization = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: input,
    select: { id: true, name: true, currency: true, timezone: true, riskThreshold: true },
  });

  // Pas d'écriture dans le journal d'audit : l'énumération AuditAction ne comporte
  // pas encore d'action « organization_update », et l'ajouter demanderait une
  // migration de la base. À faire lors du prochain cycle de migrations.
  return jsonOk(organization);
});

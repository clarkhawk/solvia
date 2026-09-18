import type { Relance } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { logAuditEvent } from "@/shared/audit/audit-log";
import { AppError } from "@/shared/errors/app-error";
import { aiProviderConfigService } from "@/modules/ai-providers/config.service";
import { clientRepository } from "@/modules/clients/repository";
import { invoiceService } from "@/modules/factures/service";
import { buildRelanceTemplate } from "./templates";
import type { CreateRelanceInput, RelanceDTO, UpdateRelanceInput } from "./types";

/** Origine du brouillon : modèle intégré ou fournisseur d'IA de l'organisation. */
export type MessageSource = "ai" | "template";

function toDTO(record: Relance): RelanceDTO {
  return {
    id: record.id,
    organizationId: record.organizationId,
    invoiceId: record.invoiceId,
    createdById: record.createdById,
    channel: record.channel,
    level: record.level,
    result: record.result,
    messageDraft: record.messageDraft,
    sentAt: record.sentAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class RelanceService {
  async getById(organizationId: string, id: string): Promise<RelanceDTO> {
    const record = await prisma.relance.findFirst({ where: { id, organizationId } });
    if (!record) {
      throw new AppError("Relance not found", 404, "RELANCE_NOT_FOUND");
    }
    return toDTO(record);
  }

  async list(organizationId: string, page: number, limit: number, invoiceId?: string) {
    const where = { organizationId, ...(invoiceId ? { invoiceId } : {}) };
    const [records, total] = await Promise.all([
      prisma.relance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.relance.count({ where }),
    ]);
    return { items: records.map(toDTO), total };
  }

  async create(organizationId: string, userId: string, input: CreateRelanceInput): Promise<RelanceDTO> {
    await invoiceService.getById(organizationId, input.invoiceId);

    const record = await prisma.relance.create({
      data: {
        organizationId,
        invoiceId: input.invoiceId,
        createdById: userId,
        channel: input.channel,
        level: input.level,
        result: input.result ?? "to_follow_up",
      },
    });

    await logAuditEvent({
      organizationId,
      userId,
      action: "relance_create",
      entityType: "Relance",
      entityId: record.id,
    });

    return toDTO(record);
  }

  async update(organizationId: string, userId: string, id: string, input: UpdateRelanceInput): Promise<RelanceDTO> {
    await this.getById(organizationId, id);

    const record = await prisma.relance.update({
      where: { id },
      data: input,
    });

    if (input.sentAt) {
      await logAuditEvent({
        organizationId,
        userId,
        action: "relance_send",
        entityType: "Relance",
        entityId: id,
      });
    }

    return toDTO(record);
  }

  async generateMessage(
    organizationId: string,
    userId: string,
    relanceId: string,
  ): Promise<{ relance: RelanceDTO; source: MessageSource }> {
    const relance = await this.getById(organizationId, relanceId);
    const invoice = await invoiceService.getById(organizationId, relance.invoiceId);
    const client = await clientRepository.findById(organizationId, invoice.clientId);

    if (!client) {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(invoice.dueAt);
    due.setHours(0, 0, 0, 0);
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, currency: true },
    });

    try {
      const generated = await aiProviderConfigService.generateMessage(organizationId, {
        channel: relance.channel,
        level: relance.level,
        invoice: {
          reference: invoice.reference,
          amount: invoice.amountRemaining,
          dueAt: invoice.dueAt,
          daysOverdue,
        },
        client: { displayName: client.identity.name },
      });

      const updated = await this.update(organizationId, userId, relanceId, {
        messageDraft: generated.content,
      });
      return { relance: updated, source: "ai" };
    } catch (error) {
      // Clé IA absente, invalide, ou fournisseur injoignable : on retombe sur le
      // modèle intégré plutôt que de laisser l'utilisateur devant un champ vide.
      console.error("Génération IA indisponible, bascule sur le modèle intégré :", error);

      const content = buildRelanceTemplate({
        channel: relance.channel,
        level: relance.level,
        clientName: client.identity.name,
        reference: invoice.reference,
        amountRemaining: invoice.amountRemaining,
        dueAt: invoice.dueAt,
        daysOverdue,
        currency: organization?.currency ?? "XOF",
        organizationName: organization?.name ?? "notre service comptable",
      });

      const updated = await this.update(organizationId, userId, relanceId, {
        messageDraft: content,
      });
      return { relance: updated, source: "template" };
    }
  }
}

export const relanceService = new RelanceService();

import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { logAuditEvent } from "@/shared/audit/audit-log";
import { scoringCalculatorService, validateCriteria } from "./calculator.service";
import type { ScoringConfigDTO, ScoringCriterion, ScoringInput, ScoringResult } from "./types";
import { DEFAULT_CRITERIA } from "./types";

export class ScoringConfigService {
  async getConfig(organizationId: string): Promise<ScoringConfigDTO> {
    let config = await prisma.scoringConfig.findUnique({ where: { organizationId } });

    if (!config) {
      config = await prisma.scoringConfig.create({
        data: {
          organizationId,
          criteria: DEFAULT_CRITERIA as unknown as Prisma.InputJsonValue,
          riskThreshold: 70,
        },
      });
    }

    return {
      id: config.id,
      organizationId: config.organizationId,
      criteria: config.criteria as ScoringCriterion[],
      riskThreshold: config.riskThreshold,
    };
  }

  async updateConfig(
    organizationId: string,
    userId: string,
    criteria: ScoringCriterion[],
    riskThreshold: number,
  ): Promise<ScoringConfigDTO> {
    const validated = validateCriteria(criteria);

    const config = await prisma.scoringConfig.upsert({
      where: { organizationId },
      create: { organizationId, criteria: validated as unknown as Prisma.InputJsonValue, riskThreshold },
      update: { criteria: validated as unknown as Prisma.InputJsonValue, riskThreshold },
    });

    await logAuditEvent({
      organizationId,
      userId,
      action: "scoring_update",
      entityType: "ScoringConfig",
      entityId: config.id,
    });

    return {
      id: config.id,
      organizationId: config.organizationId,
      criteria: config.criteria as ScoringCriterion[],
      riskThreshold: config.riskThreshold,
    };
  }

  async computeForClient(organizationId: string, input: ScoringInput): Promise<ScoringResult> {
    const config = await this.getConfig(organizationId);
    return scoringCalculatorService.compute(input, config);
  }

  async computeAllClients(organizationId: string): Promise<Array<{ clientId: string; result: ScoringResult }>> {
    const clients = await prisma.client.findMany({ where: { organizationId } });
    const results: Array<{ clientId: string; result: ScoringResult }> = [];

    for (const client of clients) {
      const invoices = await prisma.invoice.findMany({ where: { clientId: client.id } });
      const payments = await prisma.payment.findMany({ where: { clientId: client.id } });

      const input: ScoringInput = {
        clientId: client.id,
        invoices: invoices.map((i) => ({
          id: i.id,
          amount: Number(i.amount),
          amountPaid: Number(i.amountPaid),
          dueAt: i.dueAt,
          status: i.status,
        })),
        paymentHistory: payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paidAt: p.paidAt,
        })),
      };

      const result = await this.computeForClient(organizationId, input);
      results.push({ clientId: client.id, result });
    }

    return results.sort((a, b) => b.result.score - a.result.score);
  }
}

export const scoringConfigService = new ScoringConfigService();

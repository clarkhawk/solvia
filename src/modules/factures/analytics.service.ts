/**
 * @file analytics.service.ts
 * @description Statistiques de recouvrement du tableau de bord : balance âgée,
 * résultats des relances, encaissements mensuels et principaux débiteurs.
 *
 * Toutes les données sont calculées à partir des factures, paiements et relances
 * de l'organisation ; aucune valeur n'est estimée ni simulée.
 *
 * @module modules/factures/analytics.service
 */

import { prisma } from "@/shared/db/prisma";
import { decryptPii } from "@/shared/crypto/encryption";
import { decimalToNumber } from "./status";

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

export interface RelanceOutcome {
  result: string;
  label: string;
  count: number;
}

export interface MonthlyCollection {
  month: string;
  label: string;
  amount: number;
}

export interface TopDebtor {
  clientId: string;
  name: string;
  outstanding: number;
  invoiceCount: number;
  oldestDays: number;
}

export interface DashboardAnalytics {
  currency: string;
  aging: AgingBucket[];
  relanceOutcomes: RelanceOutcome[];
  monthlyCollections: MonthlyCollection[];
  topDebtors: TopDebtor[];
  totals: {
    outstanding: number;
    overdue: number;
    relances: number;
    recoveryRate: number;
  };
}

const OPEN_STATUSES = ["upcoming", "overdue", "partially_paid"] as const;

const RELANCE_LABELS: Record<string, string> = {
  payment_received: "Paiement reçu",
  payment_promise: "Promesse de paiement",
  response_received: "Réponse reçue",
  to_follow_up: "À relancer",
  no_response: "Sans réponse",
};

const MONTH_LABELS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** Nombre de jours entiers écoulés depuis une date, en UTC. */
function daysSince(date: Date): number {
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - target) / 86_400_000);
}

function clientName(encrypted: Uint8Array): string {
  try {
    const identity = JSON.parse(decryptPii(encrypted)) as { name?: string; companyName?: string };
    return identity.name ?? identity.companyName ?? "Client";
  } catch {
    return "Client";
  }
}

export class InvoiceAnalyticsService {
  async getAnalytics(organizationId: string): Promise<DashboardAnalytics> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { currency: true },
    });

    const openInvoices = await prisma.invoice.findMany({
      where: { organizationId, status: { in: [...OPEN_STATUSES] } },
      select: { clientId: true, amount: true, amountPaid: true, dueAt: true, status: true },
    });

    // --- Balance âgée : ce qui reste dû, réparti par ancienneté du retard -----
    const buckets: AgingBucket[] = [
      { label: "Pas encore échu", amount: 0, count: 0 },
      { label: "1 à 30 jours", amount: 0, count: 0 },
      { label: "31 à 60 jours", amount: 0, count: 0 },
      { label: "61 à 90 jours", amount: 0, count: 0 },
      { label: "Plus de 90 jours", amount: 0, count: 0 },
    ];

    let outstanding = 0;
    let overdue = 0;

    for (const invoice of openInvoices) {
      const remaining = Math.max(
        0,
        decimalToNumber(invoice.amount) - decimalToNumber(invoice.amountPaid),
      );
      if (remaining <= 0) continue;

      outstanding += remaining;
      const late = daysSince(invoice.dueAt);
      const index = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4;
      if (index > 0) overdue += remaining;

      buckets[index].amount += remaining;
      buckets[index].count += 1;
    }

    // --- Résultats des relances ---------------------------------------------
    const relanceGroups = await prisma.relance.groupBy({
      by: ["result"],
      where: { organizationId },
      _count: { _all: true },
    });

    const relanceOutcomes: RelanceOutcome[] = relanceGroups
      .map((group) => ({
        result: group.result,
        label: RELANCE_LABELS[group.result] ?? group.result,
        count: group._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const totalRelances = relanceOutcomes.reduce((sum, item) => sum + item.count, 0);
    const converted = relanceOutcomes
      .filter((item) => item.result === "payment_received" || item.result === "payment_promise")
      .reduce((sum, item) => sum + item.count, 0);

    // --- Encaissements des six derniers mois ---------------------------------
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const payments = await prisma.payment.findMany({
      where: { organizationId, paidAt: { gte: from } },
      select: { amount: true, paidAt: true },
    });

    const monthlyCollections: MonthlyCollection[] = [];
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      monthlyCollections.push({
        month: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
        label: MONTH_LABELS[date.getUTCMonth()],
        amount: 0,
      });
    }

    for (const payment of payments) {
      const key = `${payment.paidAt.getUTCFullYear()}-${String(payment.paidAt.getUTCMonth() + 1).padStart(2, "0")}`;
      const slot = monthlyCollections.find((item) => item.month === key);
      if (slot) slot.amount += decimalToNumber(payment.amount);
    }

    // --- Principaux débiteurs -------------------------------------------------
    const byClient = new Map<string, { outstanding: number; invoiceCount: number; oldestDays: number }>();

    for (const invoice of openInvoices) {
      const remaining = Math.max(
        0,
        decimalToNumber(invoice.amount) - decimalToNumber(invoice.amountPaid),
      );
      if (remaining <= 0) continue;

      const entry = byClient.get(invoice.clientId) ?? { outstanding: 0, invoiceCount: 0, oldestDays: 0 };
      entry.outstanding += remaining;
      entry.invoiceCount += 1;
      entry.oldestDays = Math.max(entry.oldestDays, Math.max(0, daysSince(invoice.dueAt)));
      byClient.set(invoice.clientId, entry);
    }

    const ranked = [...byClient.entries()]
      .sort((a, b) => b[1].outstanding - a[1].outstanding)
      .slice(0, 5);

    const clients = await prisma.client.findMany({
      where: { organizationId, id: { in: ranked.map(([id]) => id) } },
      select: { id: true, identityEncrypted: true },
    });
    const namesById = new Map(clients.map((c) => [c.id, clientName(c.identityEncrypted)]));

    const topDebtors: TopDebtor[] = ranked.map(([clientId, stats]) => ({
      clientId,
      name: namesById.get(clientId) ?? "Client",
      outstanding: stats.outstanding,
      invoiceCount: stats.invoiceCount,
      oldestDays: stats.oldestDays,
    }));

    return {
      currency: organization?.currency ?? "XOF",
      aging: buckets,
      relanceOutcomes,
      monthlyCollections,
      topDebtors,
      totals: {
        outstanding,
        overdue,
        relances: totalRelances,
        recoveryRate: totalRelances > 0 ? Math.round((converted / totalRelances) * 100) : 0,
      },
    };
  }
}

export const invoiceAnalyticsService = new InvoiceAnalyticsService();

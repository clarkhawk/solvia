import type { MetricType, ScoringInput } from "../types";

export type MetricCalculator = (input: ScoringInput) => number;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const METRIC_CALCULATORS: Record<MetricType, MetricCalculator> = {
  montant_en_retard: (input) => {
    return input.invoices
      .filter((i) => ["overdue", "partially_paid"].includes(i.status))
      .reduce((sum, i) => sum + Math.max(0, i.amount - i.amountPaid), 0);
  },

  anciennete_retard: (input) => {
    const now = today().getTime();
    const overdue = input.invoices.filter((i) => i.status === "overdue" || i.status === "partially_paid");
    if (overdue.length === 0) return 0;
    const maxDays = Math.max(
      ...overdue.map((i) => Math.max(0, Math.floor((now - new Date(i.dueAt).getTime()) / 86400000))),
    );
    return maxDays;
  },

  taux_retard_historique: (input) => {
    if (input.invoices.length === 0) return 0;
    const overdueCount = input.invoices.filter((i) => i.status === "overdue" || i.status === "partially_paid").length;
    return overdueCount / input.invoices.length;
  },

  nombre_factures_impayees: (input) => {
    return input.invoices.filter((i) => !["paid", "cancelled"].includes(i.status)).length;
  },

  montant_total_exposition: (input) => {
    return input.invoices
      .filter((i) => !["paid", "cancelled"].includes(i.status))
      .reduce((sum, i) => sum + Math.max(0, i.amount - i.amountPaid), 0);
  },
};

export const METRIC_NORMALIZERS: Record<MetricType, (raw: number, input: ScoringInput) => number> = {
  montant_en_retard: (raw) => Math.min(100, (raw / 10000) * 100),
  anciennete_retard: (raw) => Math.min(100, (raw / 90) * 100),
  taux_retard_historique: (raw) => raw * 100,
  nombre_factures_impayees: (raw) => Math.min(100, (raw / 10) * 100),
  montant_total_exposition: (raw) => Math.min(100, (raw / 20000) * 100),
};

import { z } from "zod";

export const metricTypeSchema = z.enum([
  "montant_en_retard",
  "anciennete_retard",
  "taux_retard_historique",
  "nombre_factures_impayees",
  "montant_total_exposition",
]);

export const scoringCriterionSchema = z.object({
  name: z.string().min(1).max(100),
  metricType: metricTypeSchema,
  weight: z.number().min(0).max(1),
  enabled: z.boolean(),
});

export const updateScoringConfigSchema = z.object({
  criteria: z.array(scoringCriterionSchema).min(1),
  riskThreshold: z.number().int().min(0).max(100),
});

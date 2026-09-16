import { METRIC_CALCULATORS, METRIC_NORMALIZERS } from "./metrics";
import type { ScoringConfigDTO, ScoringCriterion, ScoringInput, ScoringResult } from "./types";

export class ScoringCalculatorService {
  compute(input: ScoringInput, config: Pick<ScoringConfigDTO, "criteria" | "riskThreshold">): ScoringResult {
    const enabledCriteria = config.criteria.filter((c) => c.enabled && c.weight > 0);
    const totalWeight = enabledCriteria.reduce((sum, c) => sum + c.weight, 0);

    if (totalWeight === 0) {
      return { score: 0, breakdown: {}, isAtRisk: false };
    }

    const breakdown: Record<string, number> = {};
    let weightedSum = 0;

    for (const criterion of enabledCriteria) {
      const raw = METRIC_CALCULATORS[criterion.metricType](input);
      const normalized = METRIC_NORMALIZERS[criterion.metricType](raw, input);
      const contribution = (normalized * criterion.weight) / totalWeight;
      breakdown[criterion.name] = Math.round(contribution * 100) / 100;
      weightedSum += contribution;
    }

    const score = Math.round(Math.min(100, Math.max(0, weightedSum)) * 100) / 100;

    return {
      score,
      breakdown,
      isAtRisk: score >= config.riskThreshold,
    };
  }
}

export const scoringCalculatorService = new ScoringCalculatorService();

export function validateCriteria(criteria: ScoringCriterion[]): ScoringCriterion[] {
  return criteria.map((c) => ({
    ...c,
    weight: Math.max(0, Math.min(1, c.weight)),
  }));
}

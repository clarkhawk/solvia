import { updateScoringConfigSchema } from "@/modules/scoring/schemas";
import { scoringConfigService } from "@/modules/scoring/config.service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("scoring:configure", async (ctx) => {
  const config = await scoringConfigService.getConfig(ctx.organizationId);
  return jsonOk(config);
});

export const PUT = withAuth("scoring:configure", async (ctx, request) => {
  const body = updateScoringConfigSchema.parse(await request.json());
  const config = await scoringConfigService.updateConfig(
    ctx.organizationId,
    ctx.userId,
    body.criteria,
    body.riskThreshold,
  );
  return jsonOk(config);
});

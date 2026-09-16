import { scoringConfigService } from "@/modules/scoring/config.service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("invoices:read", async (ctx) => {
  const results = await scoringConfigService.computeAllClients(ctx.organizationId);
  return jsonOk(results);
});

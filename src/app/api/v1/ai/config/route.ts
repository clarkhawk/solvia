import { upsertAIConfigSchema } from "@/modules/ai-providers/schemas";
import { aiProviderConfigService } from "@/modules/ai-providers/config.service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("ai:configure", async (ctx) => {
  const config = await aiProviderConfigService.getConfig(ctx.organizationId);
  return jsonOk(config);
});

export const PUT = withAuth("ai:configure", async (ctx, request) => {
  const body = upsertAIConfigSchema.parse(await request.json());
  const config = await aiProviderConfigService.upsertConfig(
    ctx.organizationId,
    ctx.userId,
    body.provider,
    body.apiKey,
  );
  return jsonOk(config);
});

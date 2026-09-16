import { relanceService } from "@/modules/relances/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const POST = withAuth("relances:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").slice(-2)[0]!;
  const relance = await relanceService.generateMessage(ctx.organizationId, ctx.userId, id);
  return jsonOk(relance);
});

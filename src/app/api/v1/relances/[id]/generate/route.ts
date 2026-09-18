import { relanceService } from "@/modules/relances/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const POST = withAuth("relances:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").slice(-2)[0]!;
  const { relance, source } = await relanceService.generateMessage(ctx.organizationId, ctx.userId, id);
  // messageSource permet à l'interface d'indiquer honnêtement l'origine du brouillon.
  return jsonOk({ ...relance, messageSource: source });
});

import { updateRelanceSchema } from "@/modules/relances/schemas";
import { relanceService } from "@/modules/relances/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("relances:read", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  const relance = await relanceService.getById(ctx.organizationId, id);
  return jsonOk(relance);
});

export const PATCH = withAuth("relances:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  const body = updateRelanceSchema.parse(await request.json());
  const relance = await relanceService.update(ctx.organizationId, ctx.userId, id, body);
  return jsonOk(relance);
});

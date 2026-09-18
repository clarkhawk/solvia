import { createRelanceSchema } from "@/modules/relances/schemas";
import { relanceService } from "@/modules/relances/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("relances:read", async (ctx, request) => {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const invoiceId = params.get("invoiceId") ?? undefined;
  const result = await relanceService.list(ctx.organizationId, page, limit, invoiceId);
  return jsonOk(result);
});

export const POST = withAuth("relances:write", async (ctx, request) => {
  const body = createRelanceSchema.parse(await request.json());
  const relance = await relanceService.create(ctx.organizationId, ctx.userId, body);
  return jsonOk(relance, 201);
});

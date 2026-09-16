import { createClientSchema, listClientsSchema } from "@/modules/clients/schemas";
import { clientService } from "@/modules/clients/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("clients:read", async (ctx, request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { page, limit } = listClientsSchema.parse(params);
  const result = await clientService.list(ctx.organizationId, page, limit);
  return jsonOk(result);
});

export const POST = withAuth("clients:write", async (ctx, request) => {
  const body = createClientSchema.parse(await request.json());
  const client = await clientService.create(ctx.organizationId, ctx.userId, body);
  return jsonOk(client, 201);
});

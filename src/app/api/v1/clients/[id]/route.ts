import { updateClientSchema } from "@/modules/clients/schemas";
import { clientService } from "@/modules/clients/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("clients:read", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  const client = await clientService.getById(ctx.organizationId, id);
  return jsonOk(client);
});

export const PATCH = withAuth("clients:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  const body = updateClientSchema.parse(await request.json());
  const client = await clientService.update(ctx.organizationId, ctx.userId, id, body);
  return jsonOk(client);
});

export const DELETE = withAuth("clients:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  await clientService.delete(ctx.organizationId, ctx.userId, id);
  return jsonOk({ success: true });
});

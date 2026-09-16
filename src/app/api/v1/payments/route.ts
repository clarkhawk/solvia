import { createPaymentSchema } from "@/modules/paiements/schemas";
import { paymentAllocationService } from "@/modules/paiements/allocation.service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("invoices:read", async (ctx, request) => {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const result = await paymentAllocationService.list(ctx.organizationId, page, limit);
  return jsonOk(result);
});

export const POST = withAuth("payments:write", async (ctx, request) => {
  const body = createPaymentSchema.parse(await request.json());
  const payment = await paymentAllocationService.createAndAllocate(ctx.organizationId, ctx.userId, body);
  return jsonOk(payment, 201);
});

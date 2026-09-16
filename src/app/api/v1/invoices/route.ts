import { createInvoiceSchema, listInvoicesSchema } from "@/modules/factures/schemas";
import { invoiceService } from "@/modules/factures/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("invoices:read", async (ctx, request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { page, limit, status, clientId } = listInvoicesSchema.parse(params);
  const result = await invoiceService.list(ctx.organizationId, page, limit, { status, clientId });
  return jsonOk(result);
});

export const POST = withAuth("invoices:write", async (ctx, request) => {
  const body = createInvoiceSchema.parse(await request.json());
  const invoice = await invoiceService.create(ctx.organizationId, ctx.userId, body);
  return jsonOk(invoice, 201);
});

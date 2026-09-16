import { updateInvoiceSchema } from "@/modules/factures/schemas";
import { invoiceService } from "@/modules/factures/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("invoices:read", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  const invoice = await invoiceService.getById(ctx.organizationId, id);
  return jsonOk(invoice);
});

export const PATCH = withAuth("invoices:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  const body = updateInvoiceSchema.parse(await request.json());
  const invoice = await invoiceService.update(ctx.organizationId, ctx.userId, id, body);
  return jsonOk(invoice);
});

export const DELETE = withAuth("invoices:write", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  await invoiceService.delete(ctx.organizationId, ctx.userId, id);
  return jsonOk({ success: true });
});

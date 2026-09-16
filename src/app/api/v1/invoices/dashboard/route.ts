import { invoiceService } from "@/modules/factures/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("invoices:read", async (ctx) => {
  const summary = await invoiceService.getDashboardSummary(ctx.organizationId);
  return jsonOk(summary);
});

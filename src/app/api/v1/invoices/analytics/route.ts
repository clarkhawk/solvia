import { invoiceAnalyticsService } from "@/modules/factures/analytics.service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Statistiques de recouvrement du tableau de bord.
 *
 * @route GET /api/v1/invoices/analytics
 */
export const GET = withAuth("invoices:read", async (ctx) => {
  const analytics = await invoiceAnalyticsService.getAnalytics(ctx.organizationId);
  return jsonOk(analytics);
});

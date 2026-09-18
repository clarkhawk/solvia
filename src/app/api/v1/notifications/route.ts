import { prisma } from "@/shared/db/prisma";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("alerts:receive", async (ctx) => {
  const notifications = await prisma.inAppNotification.findMany({
    where: { organizationId: ctx.organizationId, userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return jsonOk(notifications);
});

export const PATCH = withAuth("alerts:receive", async (ctx, request) => {
  const body = (await request.json()) as { id?: string; markAllRead?: boolean };
  if (body.markAllRead) {
    await prisma.inAppNotification.updateMany({
      where: { organizationId: ctx.organizationId, userId: ctx.userId, read: false },
      data: { read: true },
    });
  } else if (body.id) {
    await prisma.inAppNotification.updateMany({
      where: { id: body.id, organizationId: ctx.organizationId, userId: ctx.userId },
      data: { read: true },
    });
  }
  return jsonOk({ success: true });
});

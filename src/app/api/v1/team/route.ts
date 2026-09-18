import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { logAuditEvent } from "@/shared/audit/audit-log";
import { jsonOk, withAuth } from "@/shared/api/handler";
import { AppError } from "@/shared/errors/app-error";

const updatePermissionsSchema = z.object({
  userId: z.string().uuid(),
  canReceiveAlerts: z.boolean(),
  canRelanceClients: z.boolean(),
});

export const GET = withAuth("team:manage", async (ctx) => {
  const users = await prisma.user.findMany({
    where: { organizationId: ctx.organizationId },
    select: {
      id: true,
      email: true,
      role: true,
      canReceiveAlerts: true,
      canRelanceClients: true,
    },
    orderBy: { email: "asc" },
  });
  return jsonOk(users);
});

export const PATCH = withAuth("team:manage", async (ctx, request) => {
  const body = updatePermissionsSchema.parse(await request.json());

  const user = await prisma.user.findFirst({
    where: { id: body.userId, organizationId: ctx.organizationId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updated = await prisma.user.update({
    where: { id: body.userId },
    data: {
      canReceiveAlerts: body.canReceiveAlerts,
      canRelanceClients: body.canRelanceClients,
    },
    select: {
      id: true,
      email: true,
      role: true,
      canReceiveAlerts: true,
      canRelanceClients: true,
    },
  });

  await logAuditEvent({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "user_permission_update",
    entityType: "User",
    entityId: body.userId,
    metadata: body,
  });

  return jsonOk(updated);
});

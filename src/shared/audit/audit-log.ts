import type { AuditAction } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

export interface AuditLogInput {
  organizationId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}

import { prisma } from "@/shared/db/prisma";
import type { AlertNotificationPayload } from "../types";

export class InAppNotifier {
  async send(organizationId: string, userId: string, payload: AlertNotificationPayload): Promise<void> {
    await prisma.inAppNotification.create({
      data: {
        organizationId,
        userId,
        title: payload.title,
        message: payload.message,
      },
    });
  }
}

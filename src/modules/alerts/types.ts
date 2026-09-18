import type { AlertStatus, AlertType } from "@prisma/client";

export interface AlertEventDTO {
  id: string;
  organizationId: string;
  invoiceId: string;
  alertType: AlertType;
  status: AlertStatus;
  triggeredAt: Date;
}

export interface AlertNotificationPayload {
  title: string;
  message: string;
  invoiceReference: string;
  clientName: string;
  dueAt: Date;
  alertType: AlertType;
}

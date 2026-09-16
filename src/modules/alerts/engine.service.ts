import type { AlertType } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { invoiceRepository } from "@/modules/factures/repository";
import { clientRepository } from "@/modules/clients/repository";
import type { AlertNotificationPayload } from "./types";
import { InAppNotifier } from "./notifiers/in-app.notifier";
import { EmailNotifier } from "./notifiers/email.notifier";
import { WhatsAppNotifier } from "./notifiers/whatsapp.notifier";

function getAlertType(dueAt: Date, today: Date): AlertType | null {
  const due = new Date(dueAt);
  due.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((due.getTime() - t.getTime()) / 86400000);

  if (diffDays === 7) return "due_in_7";
  if (diffDays === 0) return "due_today";
  if (diffDays === -7) return "overdue_7";
  return null;
}

const ALERT_LABELS: Record<AlertType, string> = {
  due_in_7: "Échéance dans 7 jours",
  due_today: "Échéance aujourd'hui",
  overdue_7: "Retard de 7 jours",
};

export class AlertEngineService {
  private inApp = new InAppNotifier();
  private email = new EmailNotifier();
  private whatsapp = new WhatsAppNotifier();

  async runForAllOrganizations(): Promise<{ processed: number; alerts: number }> {
    const orgs = await prisma.organization.findMany({ select: { id: true } });
    let totalAlerts = 0;

    for (const org of orgs) {
      const count = await this.runForOrganization(org.id);
      totalAlerts += count;
    }

    return { processed: orgs.length, alerts: totalAlerts };
  }

  async runForOrganization(organizationId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoices = await invoiceRepository.findDueForAlerts(organizationId, today);
    let alertCount = 0;

    for (const invoice of invoices) {
      const alertType = getAlertType(invoice.dueAt, today);
      if (!alertType) continue;

      const existing = await prisma.alertEvent.findUnique({
        where: { invoiceId_alertType: { invoiceId: invoice.id, alertType } },
      });
      if (existing) continue;

      await prisma.alertEvent.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          alertType,
          status: "pending",
        },
      });

      const client = await clientRepository.findById(organizationId, invoice.clientId);
      const payload: AlertNotificationPayload = {
        title: ALERT_LABELS[alertType],
        message: `Facture ${invoice.reference} — ${client?.identity.name ?? "Client"} — ${invoice.amountRemaining.toFixed(2)} EUR restants`,
        invoiceReference: invoice.reference,
        clientName: client?.identity.name ?? "Client",
        dueAt: invoice.dueAt,
        alertType,
      };

      await this.notifyTeam(organizationId, payload);
      alertCount++;

      await prisma.alertEvent.updateMany({
        where: { invoiceId: invoice.id, alertType },
        data: { status: "sent" },
      });
    }

    return alertCount;
  }

  private async notifyTeam(organizationId: string, payload: AlertNotificationPayload): Promise<void> {
    const users = await prisma.user.findMany({
      where: { organizationId, canReceiveAlerts: true },
      include: { notificationPreference: true },
    });

    await Promise.allSettled(
      users.map(async (user) => {
        const prefs = user.notificationPreference ?? { inApp: true, email: true, whatsapp: false };

        if (prefs.inApp) {
          await this.inApp.send(organizationId, user.id, payload);
        }
        if (prefs.email) {
          await this.email.send(user.email, payload);
        }
        if (prefs.whatsapp && user.notificationPreference?.whatsappNumberEncrypted) {
          await this.whatsapp.send(user.notificationPreference.whatsappNumberEncrypted, payload);
        }
      }),
    );
  }
}

export const alertEngineService = new AlertEngineService();

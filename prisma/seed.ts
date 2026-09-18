import { PrismaClient, UserRole } from "@prisma/client";
import { encryptPii } from "../src/shared/crypto/encryption";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Demo PME",
      timezone: "Europe/Paris",
      currency: "EUR",
      riskThreshold: 70,
    },
  });

  await prisma.user.upsert({
    where: { authUserId: "demo-auth-user" },
    update: {},
    create: {
      organizationId: org.id,
      authUserId: "demo-auth-user",
      role: UserRole.admin,
      email: "admin@demo.solvia.app",
      canReceiveAlerts: true,
      canRelanceClients: true,
    },
  });

  await prisma.scoringConfig.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      criteria: [
        { name: "Montant en retard", metricType: "montant_en_retard", weight: 0.5, enabled: true },
        { name: "Ancienneté du retard", metricType: "anciennete_retard", weight: 0.3, enabled: true },
        { name: "Historique de retards", metricType: "taux_retard_historique", weight: 0.2, enabled: true },
      ],
      riskThreshold: 70,
    },
  });

  const client = await prisma.client.create({
    data: {
      organizationId: org.id,
      externalCode: "CLI-001",
      identityEncrypted: encryptPii(JSON.stringify({ name: "Acme SARL", companyName: "Acme SARL" })),
      contactEncrypted: encryptPii(JSON.stringify({ email: "contact@acme.fr", phone: "+33600000000" })),
      emailHash: "demo",
    },
  });

  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client.id,
      reference: "FAC-2025-001",
      amount: 1500,
      amountPaid: 0,
      issuedAt: new Date("2025-08-01"),
      dueAt: new Date("2025-09-01"),
      status: "overdue",
    },
  });

  console.log("Seed completed for org:", org.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

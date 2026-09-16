/**
 * Lie un utilisateur Supabase Auth à la table users Solvia.
 *
 * Usage:
 *   AUTH_USER_ID=<uuid-supabase> EMAIL=admin@pme.fr ROLE=admin npm run auth:link-user
 *
 * Prérequis: org demo créée via npm run db:seed (id 00000000-0000-0000-0000-000000000001)
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const authUserId = process.env.AUTH_USER_ID;
  const email = process.env.EMAIL;
  const role = (process.env.ROLE ?? "admin") as UserRole;

  if (!authUserId || !email) {
    console.error("Usage: AUTH_USER_ID=<uuid> EMAIL=<email> [ROLE=admin] npm run auth:link-user");
    process.exit(1);
  }

  const org = await prisma.organization.findUnique({ where: { id: DEMO_ORG_ID } });
  if (!org) {
    console.error("Organisation demo introuvable. Lancez d'abord: npm run db:seed");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { authUserId },
    update: { email, role },
    create: {
      organizationId: DEMO_ORG_ID,
      authUserId,
      email,
      role,
      canReceiveAlerts: true,
      canRelanceClients: role === "admin" || role === "dirigeant",
    },
  });

  console.log("Utilisateur lié:", {
    id: user.id,
    authUserId: user.authUserId,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

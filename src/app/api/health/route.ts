import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sonde de santé publique : dit si l'application joint sa base de données.
 * Ne renvoie ni chaîne de connexion, ni identifiant, ni donnée métier —
 * seulement un état, un code technique et une latence.
 *
 * @route GET /api/health
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("[health] base injoignable", error);

    const code =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : error instanceof Prisma.PrismaClientInitializationError
          ? "DB_UNREACHABLE"
          : "UNKNOWN";

    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        code,
        hint:
          "Vérifier DATABASE_URL sur l'hébergeur : hôte du pooler, utilisateur postgres.<référence-projet>, port 6543 pour l'exécution.",
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }

  // La base répond : les tables sont-elles là ?
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "users" LIMIT 1');
  } catch (error) {
    console.error("[health] schéma incomplet", error);
    return NextResponse.json(
      {
        status: "error",
        database: "reachable",
        schema: "missing",
        hint: "Les migrations Prisma n'ont pas été appliquées sur cette base : lancer `npm run db:migrate:deploy`.",
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: "ok",
    database: "reachable",
    schema: "present",
    latencyMs: Date.now() - startedAt,
  });
}

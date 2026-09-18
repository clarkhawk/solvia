import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAuthContext } from "@/shared/auth/get-auth-context";
import type { AuthContext } from "@/shared/auth/types";
import { requirePermission } from "@/shared/auth/rbac";
import type { Permission } from "@/shared/auth/types";
import { isAppError } from "@/shared/errors/app-error";
import { ZodError } from "zod";

type HandlerFn = (ctx: AuthContext, request: Request) => Promise<NextResponse>;

interface MappedError {
  status: number;
  code: string;
  message: string;
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Traduit une erreur Prisma en réponse HTTP exploitable.
 * Le code Prisma (P2002, P2021…) est conservé pour le diagnostic : il ne
 * contient aucune donnée sensible, contrairement au message brut.
 */
function mapPrismaError(error: unknown): MappedError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return { status: 409, code: "P2002", message: "Cette donnée existe déjà." };
      case "P2003":
        return {
          status: 409,
          code: "P2003",
          message: "Enregistrement lié introuvable : la donnée référencée n'existe pas encore.",
        };
      case "P2025":
        return { status: 404, code: "P2025", message: "Enregistrement introuvable." };
      case "P2021":
      case "P2022":
        return {
          status: 500,
          code: error.code,
          message:
            "Le schéma de la base de données est incomplet : les migrations Prisma n'ont pas été appliquées sur cet environnement.",
        };
      default:
        return { status: 500, code: error.code, message: "Erreur de base de données." };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      code: "DB_UNAVAILABLE",
      message:
        "Connexion à la base de données impossible : vérifier DATABASE_URL et la disponibilité du serveur.",
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 500, code: "DB_VALIDATION", message: "Requête base de données invalide." };
  }

  return null;
}

export function withAuth(permission: Permission | null, handler: HandlerFn) {
  return async (request: Request): Promise<NextResponse> => {
    // Identifiant de corrélation : celui de Vercel s'il existe, sinon un UUID.
    const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();

    try {
      const ctx = await getAuthContext();
      if (permission) {
        requirePermission(ctx, permission);
      }
      return await handler(ctx, request);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Données de la requête invalides.",
            code: "VALIDATION_ERROR",
            details: error.flatten().fieldErrors,
            requestId,
          },
          { status: 400 },
        );
      }
      if (isAppError(error)) {
        return NextResponse.json(
          { error: error.message, code: error.code, requestId },
          { status: error.statusCode },
        );
      }
      if (error instanceof Error && error.message.startsWith("Permission denied")) {
        return NextResponse.json({ error: error.message, code: "FORBIDDEN", requestId }, { status: 403 });
      }

      // Journal serveur complet, visible dans les logs Vercel.
      console.error(
        JSON.stringify({
          level: "error",
          requestId,
          method: request.method,
          url: request.url,
          name: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
          prismaCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
        }),
      );
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      const mapped = mapPrismaError(error);
      if (mapped) {
        return NextResponse.json(
          {
            error: mapped.message,
            code: mapped.code,
            requestId,
            // Le message brut ne sort jamais en production.
            detail: isProduction ? undefined : (error as Error).message,
          },
          { status: mapped.status },
        );
      }

      return NextResponse.json(
        {
          error: "Erreur interne du serveur.",
          code: "INTERNAL_ERROR",
          requestId,
          detail: isProduction ? undefined : error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  };
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

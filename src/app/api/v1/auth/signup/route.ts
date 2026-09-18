/**
 * @file route.ts
 * @description Point d'entrée API pour l'inscription SaaS en libre-service (Self-serve Onboarding).
 * Permet à une nouvelle entreprise de créer son organisation, son compte administrateur Supabase
 * et son profil utilisateur PostgreSQL en une seule transaction atomique.
 *
 * Si l'écriture PostgreSQL échoue, l'utilisateur Supabase créé juste avant est supprimé :
 * sans cette compensation, l'adresse resterait prise côté Auth sans organisation associée,
 * donc impossible à réutiliser et bloquée en 403 à la connexion.
 *
 * @route POST /api/v1/auth/signup
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { getSupabaseAdminClient } from "@/shared/auth/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Schéma de validation Zod pour la création d'entreprise et d'utilisateur.
 */
const SignUpSchema = z.object({
  companyName: z
    .string()
    .min(2, "Le nom de l'entreprise doit comporter au moins 2 caractères.")
    .max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères."),
  email: z
    .string()
    .email("Veuillez renseigner une adresse email valide.")
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères."),
  currency: z
    .string()
    .length(3, "La devise doit être un code ISO à 3 lettres (ex: EUR).")
    .default("EUR"),
});

export type SignUpPayload = z.infer<typeof SignUpSchema>;

/**
 * Handler POST pour l'inscription d'une nouvelle entreprise.
 *
 * @param {Request} request Requête HTTP entrante contenant le payload JSON
 * @returns {Promise<NextResponse>} Réponse JSON confirmant la création ou détaillant l'erreur
 */
export async function POST(request: Request) {
  const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();
  let createdAuthUserId: string | null = null;

  try {
    const rawBody = await request.json();
    const validationResult = SignUpSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données d'inscription invalides",
          details: validationResult.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const { companyName, email, password, currency } = validationResult.data;

    // 1. Créer l'utilisateur dans Supabase Auth via le client Admin.
    const supabaseAdmin = getSupabaseAdminClient();

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmation automatique pour accès immédiat
      user_metadata: {
        company_name: companyName,
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already registered") || authError.status === 422) {
        return NextResponse.json(
          { error: "Cet email est déjà enregistré dans Supabase. Veuillez vous connecter.", requestId },
          { status: 409 },
        );
      }

      console.error("[SignUp] Erreur Supabase Auth Admin:", authError);
      return NextResponse.json(
        { error: `Erreur lors de la création de l'accès auth : ${authError.message}`, requestId },
        { status: 500 },
      );
    }

    if (!authUser?.user) {
      return NextResponse.json(
        { error: "Impossible de générer le profil d'authentification.", requestId },
        { status: 500 },
      );
    }

    const authUserId = authUser.user.id;
    createdAuthUserId = authUserId;

    // 2. Création atomique de l'Organisation, du Scoring et du profil User dans PostgreSQL.
    //    Le pooler ajoute de la latence : la fenêtre par défaut de 5 s est trop courte.
    const newOrganization = await prisma.$transaction(
      async (tx) => {
        // A. Création de l'entité Entreprise / Organisation
        const org = await tx.organization.create({
          data: {
            name: companyName,
            currency,
            timezone: "Europe/Paris",
            riskThreshold: 70,
          },
        });

        // B. Configuration de scoring par défaut
        await tx.scoringConfig.create({
          data: {
            organizationId: org.id,
            riskThreshold: 70,
            criteria: [
              { name: "Montant en retard", metricType: "montant_en_retard", weight: 0.5, enabled: true },
              { name: "Ancienneté du retard", metricType: "anciennete_retard", weight: 0.3, enabled: true },
              { name: "Historique de retards", metricType: "taux_retard_historique", weight: 0.2, enabled: true },
            ],
          },
        });

        // C. Création de l'utilisateur avec privilège Administrateur
        const dbUser = await tx.user.create({
          data: {
            organizationId: org.id,
            authUserId,
            email,
            role: UserRole.admin,
            canReceiveAlerts: true,
            canRelanceClients: true,
          },
        });

        // D. Premier événement d'audit
        await tx.auditLog.create({
          data: {
            organizationId: org.id,
            userId: dbUser.id,
            action: "login",
            entityType: "organization",
            entityId: org.id,
            metadata: {
              event: "onboarding_completed",
              company: companyName,
            },
          },
        });

        return org;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Entreprise et compte créés avec succès.",
        organization: {
          id: newOrganization.id,
          name: newOrganization.name,
        },
        user: {
          email,
          authUserId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        scope: "signup",
        requestId,
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        prismaCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
      }),
    );
    if (error instanceof Error && error.stack) console.error(error.stack);

    // Compensation : l'accès Auth ne doit pas survivre à l'échec de l'écriture métier.
    if (createdAuthUserId) {
      try {
        await getSupabaseAdminClient().auth.admin.deleteUser(createdAuthUserId);
        console.error(`[SignUp] Utilisateur Auth ${createdAuthUserId} supprimé après échec.`);
      } catch (cleanupError) {
        console.error(
          `[SignUp] ÉCHEC du nettoyage de l'utilisateur Auth ${createdAuthUserId} : à supprimer à la main dans Supabase.`,
          cleanupError,
        );
      }
    }

    const code =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : error instanceof Prisma.PrismaClientInitializationError
          ? "DB_UNREACHABLE"
          : "INTERNAL_ERROR";

    const message =
      code === "P2021" || code === "P2022"
        ? "Le schéma de la base est incomplet : migrations Prisma non appliquées."
        : code === "P2028"
          ? "La base a mis trop de temps à répondre. Réessayez dans un instant."
          : code === "DB_UNREACHABLE"
            ? "Base de données injoignable."
            : "Une erreur interne est survenue lors de la création de l'entreprise.";

    return NextResponse.json(
      {
        error: message,
        code,
        requestId,
        detail: isProduction ? undefined : error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

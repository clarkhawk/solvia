/**
 * @file route.ts
 * @description Point d'entrée API pour l'inscription SaaS en libre-service (Self-serve Onboarding).
 * Permet à une nouvelle entreprise de créer son organisation, son compte administrateur Supabase
 * et son profil utilisateur PostgreSQL en une seule transaction atomique.
 *
 * @route POST /api/v1/auth/signup
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { getSupabaseAdminClient } from "@/shared/auth/supabase-admin";
import { UserRole } from "@prisma/client";

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
  password: z
    .string()
    .min(8, "Le mot de passe doit comporter au moins 8 caractères."),
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
  try {
    const rawBody = await request.json();
    const validationResult = SignUpSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données d'inscription invalides",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { companyName, email, password, currency } = validationResult.data;

    // 1. Vérifier si l'utilisateur existe déjà dans la base PostgreSQL Solvia
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cette adresse email existe déjà. Veuillez vous connecter." },
        { status: 409 },
      );
    }

    // 2. Créer l'utilisateur dans Supabase Auth via le client Admin
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
      // Si l'utilisateur existe déjà dans Supabase Auth
      if (authError.message?.toLowerCase().includes("already registered") || authError.status === 422) {
        return NextResponse.json(
          { error: "Cet email est déjà enregistré dans Supabase. Veuillez vous connecter." },
          { status: 409 },
        );
      }

      console.error("[SignUp] Erreur Supabase Auth Admin:", authError);
      return NextResponse.json(
        { error: `Erreur lors de la création de l'accès auth : ${authError.message}` },
        { status: 500 },
      );
    }

    if (!authUser?.user) {
      return NextResponse.json(
        { error: "Impossible de générer le profil d'authentification." },
        { status: 500 },
      );
    }

    const authUserId = authUser.user.id;

    // 3. Création atomique de l'Organisation, du Scoring et du profil User dans PostgreSQL
    const newOrganization = await prisma.$transaction(async (tx) => {
      // A. Création de l'entité Entreprise / Organisation
      const org = await tx.organization.create({
        data: {
          name: companyName,
          currency,
          timezone: "Europe/Paris",
          riskThreshold: 70,
        },
      });

      // B. Configuration de scoring prédictif par défaut
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

      // C. Création de l'utilisateur avec privilège Administrateur / Dirigeant
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

      // D. Création d'un premier log d'audit
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
    });

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
    console.error("[SignUp] Erreur inattendue :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de la création de l'entreprise." },
      { status: 500 },
    );
  }
}

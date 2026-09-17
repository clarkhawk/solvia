import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { DEFAULT_CRITERIA } from "@/modules/scoring/types";

async function createGoogleOrganizationIfNeeded(user: {
  id: string;
  email?: string;
  app_metadata: { provider?: string };
  user_metadata: { full_name?: string; name?: string };
}) {
  if (user.app_metadata.provider !== "google" || !user.email) return;
  const email = user.email;

  const existing = await prisma.user.findUnique({ where: { authUserId: user.id } });
  if (existing) return;

  const displayName = user.user_metadata.full_name ?? user.user_metadata.name ?? email.split("@")[0];
  await prisma.$transaction(async (tx) => {
    // Re-check within the transaction to make the callback idempotent.
    const alreadyProvisioned = await tx.user.findUnique({ where: { authUserId: user.id } });
    if (alreadyProvisioned) return;

    const organization = await tx.organization.create({
      data: { name: `Entreprise de ${displayName}`, currency: "EUR", timezone: "Europe/Paris", riskThreshold: 70 },
    });
    await tx.scoringConfig.create({
      data: {
        organizationId: organization.id,
        riskThreshold: 70,
        criteria: DEFAULT_CRITERIA as unknown as Prisma.InputJsonValue,
      },
    });
    const dbUser = await tx.user.create({
      data: {
        organizationId: organization.id,
        authUserId: user.id,
        email,
        role: "admin",
        canReceiveAlerts: true,
        canRelanceClients: true,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: dbUser.id,
        action: "login",
        entityType: "organization",
        entityId: organization.id,
        metadata: { event: "google_onboarding_completed", provider: "google" },
      },
    });
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      try {
        await createGoogleOrganizationIfNeeded(data.user);
        return NextResponse.redirect(`${origin}${next}`);
      } catch (provisioningError) {
        console.error("[auth/callback] Google onboarding failed", provisioningError);
        return NextResponse.redirect(`${origin}/login?error=google_onboarding_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

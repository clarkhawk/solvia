import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { createSupabaseServerClient } from "@/shared/auth/supabase-server";
import { jsonOk, withAuth } from "@/shared/api/handler";
import { AppError } from "@/shared/errors/app-error";

const requestSchema = z.object({ organizationName: z.string().trim().min(2).max(100) });
const reviewSchema = z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]) });

/** A verified authenticated identity can request access, but cannot select its own role. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Nom d'organisation invalide" }, { status: 400 });
  const organization = await prisma.organization.findFirst({ where: { name: { equals: parsed.data.organizationName, mode: "insensitive" } }, select: { id: true } });
  if (!organization) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const membership = await prisma.user.findUnique({ where: { authUserId: user.id }, select: { organizationId: true } });
  if (membership?.organizationId === organization.id) return jsonOk({ status: "member" });
  if (membership) return NextResponse.json({ error: "Ce compte appartient déjà à une autre organisation." }, { status: 409 });

  const joinRequest = await prisma.joinRequest.upsert({
    where: { organizationId_authUserId: { organizationId: organization.id, authUserId: user.id } },
    create: { organizationId: organization.id, authUserId: user.id, email: user.email },
    update: { email: user.email, status: "pending", reviewedAt: null, reviewedById: null },
  });
  return jsonOk({ status: joinRequest.status }, 201);
}

export const GET = withAuth("team:manage", async (ctx) => {
  const requests = await prisma.joinRequest.findMany({ where: { organizationId: ctx.organizationId }, orderBy: { createdAt: "desc" } });
  return jsonOk(requests);
});

export const PATCH = withAuth("team:manage", async (ctx, request) => {
  const body = reviewSchema.parse(await request.json());
  const joinRequest = await prisma.joinRequest.findFirst({ where: { id: body.id, organizationId: ctx.organizationId } });
  if (!joinRequest || joinRequest.status !== "pending") throw new AppError("Join request not found", 404, "JOIN_REQUEST_NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    if (body.action === "approve") {
      const existing = await tx.user.findUnique({ where: { authUserId: joinRequest.authUserId } });
      if (existing) throw new AppError("This account already belongs to an organization", 409, "MEMBERSHIP_EXISTS");
      await tx.user.create({ data: { organizationId: ctx.organizationId, authUserId: joinRequest.authUserId, email: joinRequest.email, role: "commercial", canReceiveAlerts: false, canRelanceClients: true } });
    }
    await tx.joinRequest.update({ where: { id: joinRequest.id }, data: { status: body.action === "approve" ? "approved" : "rejected", reviewedById: ctx.userId, reviewedAt: new Date() } });
  });
  return jsonOk({ status: body.action === "approve" ? "approved" : "rejected" });
});

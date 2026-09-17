import { createHash, randomBytes } from "crypto";
import type { Invitation, UserRole } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { logAuditEvent } from "@/shared/audit/audit-log";
import { AppError } from "@/shared/errors/app-error";

const INVITATION_LIFETIME_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toDTO(invitation: Invitation) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
  };
}

export class InvitationService {
  async list(organizationId: string) {
    await this.expirePending(organizationId);
    const invitations = await prisma.invitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
    return invitations.map(toDTO);
  }

  async create(organizationId: string, invitedById: string, email: string, role: Exclude<UserRole, "admin">) {
    const member = await prisma.user.findFirst({ where: { organizationId, email } });
    if (member) throw new AppError("This email already belongs to a team member", 409, "MEMBER_EXISTS");

    await prisma.invitation.updateMany({
      where: { organizationId, email, status: "pending" },
      data: { status: "revoked" },
    });

    const token = randomBytes(32).toString("base64url");
    const invitation = await prisma.invitation.create({
      data: {
        organizationId,
        invitedById,
        email,
        role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    await logAuditEvent({
      organizationId,
      userId: invitedById,
      action: "invitation_create",
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: { email, role },
    });

    const invitationUrl = this.urlFor(token);
    const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
    const emailSent = await this.sendEmail(email, organization?.name ?? "Solvia", role, invitationUrl);
    return { ...toDTO(invitation), invitationUrl, emailSent };
  }

  async revoke(organizationId: string, userId: string, invitationId: string) {
    const invitation = await prisma.invitation.findFirst({ where: { id: invitationId, organizationId } });
    if (!invitation) throw new AppError("Invitation not found", 404, "INVITATION_NOT_FOUND");
    if (invitation.status !== "pending") throw new AppError("Only pending invitations can be revoked", 409, "INVITATION_NOT_PENDING");

    await prisma.invitation.update({ where: { id: invitationId }, data: { status: "revoked" } });
    await logAuditEvent({ organizationId, userId, action: "invitation_revoke", entityType: "Invitation", entityId: invitationId });
  }

  async validate(token: string) {
    const invitation = await this.findUsable(token);
    const organization = await prisma.organization.findUnique({ where: { id: invitation.organizationId }, select: { name: true } });
    return { email: invitation.email, role: invitation.role, organizationName: organization?.name ?? "Votre entreprise", expiresAt: invitation.expiresAt };
  }

  async consume(token: string, authUserId: string) {
    const invitation = await this.findUsable(token);
    const existing = await prisma.user.findUnique({ where: { authUserId } });
    if (existing) throw new AppError("This account is already linked to an organization", 409, "ACCOUNT_ALREADY_LINKED");

    const user = await prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, status: "pending", expiresAt: { gt: new Date() } },
        data: { status: "accepted", acceptedAt: new Date() },
      });
      if (claimed.count !== 1) throw new AppError("This invitation is no longer valid", 409, "INVITATION_UNAVAILABLE");
      return tx.user.create({
        data: {
          organizationId: invitation.organizationId,
          authUserId,
          email: invitation.email,
          role: invitation.role,
          canReceiveAlerts: invitation.role !== "commercial",
          canRelanceClients: invitation.role === "commercial",
        },
      });
    });

    await logAuditEvent({
      organizationId: invitation.organizationId,
      userId: user.id,
      action: "invitation_accept",
      entityType: "Invitation",
      entityId: invitation.id,
    });
    return user;
  }

  private async findUsable(token: string): Promise<Invitation> {
    const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invitation || invitation.status !== "pending") throw new AppError("Invitation invalid or already used", 404, "INVITATION_INVALID");
    if (invitation.expiresAt <= new Date()) {
      await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "expired" } });
      throw new AppError("Invitation expired", 410, "INVITATION_EXPIRED");
    }
    return invitation;
  }

  private async expirePending(organizationId: string): Promise<void> {
    await prisma.invitation.updateMany({ where: { organizationId, status: "pending", expiresAt: { lte: new Date() } }, data: { status: "expired" } });
  }

  private urlFor(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, "")}/signup?token=${encodeURIComponent(token)}`;
  }

  /** Email is best-effort: the administrator can always copy the returned secure link. */
  private async sendEmail(email: string, organizationName: string, role: UserRole, invitationUrl: string): Promise<boolean> {
    const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
    if (!apiKey) return false;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "alerts@solvia.app",
          to: email,
          subject: `Invitation à rejoindre ${organizationName} sur Solvia`,
          text: `Vous êtes invité(e) comme ${role} dans ${organizationName}. Créez votre compte : ${invitationUrl}`,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const invitationService = new InvitationService();

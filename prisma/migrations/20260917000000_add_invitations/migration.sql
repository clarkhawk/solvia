-- Invitations à usage unique, sécurisées par un hachage de jeton côté serveur.
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'invitation_create';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'invitation_revoke';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'invitation_accept';

CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "invited_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");
CREATE INDEX "invitations_organization_id_status_idx" ON "invitations"("organization_id", "status");
CREATE INDEX "invitations_email_status_idx" ON "invitations"("email", "status");

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "join_requests" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "auth_user_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "join_requests_organization_id_auth_user_id_key" ON "join_requests"("organization_id", "auth_user_id");
CREATE INDEX "join_requests_organization_id_status_idx" ON "join_requests"("organization_id", "status");
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

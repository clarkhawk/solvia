import { createInvitationSchema } from "@/modules/invitations/schemas";
import { invitationService } from "@/modules/invitations/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("team:manage", async (ctx) => jsonOk(await invitationService.list(ctx.organizationId)));

export const POST = withAuth("team:manage", async (ctx, request) => {
  const body = createInvitationSchema.parse(await request.json());
  return jsonOk(await invitationService.create(ctx.organizationId, ctx.userId, body.email, body.role), 201);
});

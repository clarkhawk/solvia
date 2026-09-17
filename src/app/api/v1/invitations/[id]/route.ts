import { invitationService } from "@/modules/invitations/service";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const DELETE = withAuth("team:manage", async (ctx, request) => {
  const id = new URL(request.url).pathname.split("/").pop()!;
  await invitationService.revoke(ctx.organizationId, ctx.userId, id);
  return jsonOk({ success: true });
});

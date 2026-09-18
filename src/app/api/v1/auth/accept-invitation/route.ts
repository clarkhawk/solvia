import { NextResponse } from "next/server";
import { acceptInvitationSchema } from "@/modules/invitations/schemas";
import { invitationService } from "@/modules/invitations/service";
import { getSupabaseAdminClient } from "@/shared/auth/supabase-admin";
import { AppError } from "@/shared/errors/app-error";

/** Creates an Auth identity only after a valid invitation has been checked. */
export async function POST(request: Request) {
  try {
    const body = acceptInvitationSchema.parse(await request.json());
    const invitation = await invitationService.validate(body.token);
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: invitation.email,
      password: body.password,
      email_confirm: true,
    });
    if (error || !data.user) {
      const status = error?.message.toLowerCase().includes("already") ? 409 : 500;
      return NextResponse.json({ error: status === 409 ? "An account already exists for this email" : "Unable to create account" }, { status });
    }

    try {
      await invitationService.consume(body.token, data.user.id);
    } catch (consumeError) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw consumeError;
    }
    return NextResponse.json({ success: true, email: invitation.email });
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to accept invitation" }, { status });
  }
}

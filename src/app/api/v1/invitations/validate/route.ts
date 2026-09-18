import { NextResponse } from "next/server";
import { invitationTokenSchema } from "@/modules/invitations/schemas";
import { invitationService } from "@/modules/invitations/service";
import { AppError } from "@/shared/errors/app-error";

export async function GET(request: Request) {
  try {
    const token = invitationTokenSchema.parse(new URL(request.url).searchParams.get("token"));
    return NextResponse.json(await invitationService.validate(token));
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid invitation" }, { status });
  }
}

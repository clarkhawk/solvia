import { NextResponse } from "next/server";
import { getAuthContext } from "@/shared/auth/get-auth-context";
import type { AuthContext } from "@/shared/auth/types";
import { requirePermission } from "@/shared/auth/rbac";
import type { Permission } from "@/shared/auth/types";
import { isAppError } from "@/shared/errors/app-error";

type HandlerFn = (ctx: AuthContext, request: Request) => Promise<NextResponse>;

export function withAuth(permission: Permission | null, handler: HandlerFn) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const ctx = await getAuthContext();
      if (permission) {
        requirePermission(ctx, permission);
      }
      return await handler(ctx, request);
    } catch (error) {
      if (isAppError(error)) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
      }
      if (error instanceof Error && error.message.startsWith("Permission denied")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

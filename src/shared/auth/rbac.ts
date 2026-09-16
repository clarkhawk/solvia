import type { UserRole } from "@prisma/client";
import type { AuthContext, Permission } from "./types";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "clients:read",
    "clients:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "relances:read",
    "relances:write",
    "import:execute",
    "scoring:configure",
    "ai:configure",
    "team:manage",
    "alerts:receive",
  ],
  dirigeant: [
    "clients:read",
    "clients:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "relances:read",
    "relances:write",
    "import:execute",
    "scoring:configure",
    "ai:configure",
    "alerts:receive",
  ],
  comptable: [
    "clients:read",
    "clients:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "relances:read",
    "relances:write",
    "import:execute",
    "alerts:receive",
  ],
  commercial: ["clients:read", "invoices:read", "relances:read", "relances:write", "alerts:receive"],
};

export function hasPermission(ctx: AuthContext, permission: Permission): boolean {
  if (permission === "alerts:receive") {
    return ctx.canReceiveAlerts && ROLE_PERMISSIONS[ctx.role].includes(permission);
  }
  if (permission === "relances:write" && ctx.role === "commercial") {
    return ctx.canRelanceClients;
  }
  return ROLE_PERMISSIONS[ctx.role].includes(permission);
}

export function requirePermission(ctx: AuthContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

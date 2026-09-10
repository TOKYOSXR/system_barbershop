import { redirect } from "next/navigation";

import { requireSession, type SessionContext } from "@/lib/auth/session";
import {
  hasAnyPermission,
  hasPermission,
  type Permission,
} from "@/lib/permissions/permissions";

/** Raised when an authenticated user lacks the required permission. */
export class ForbiddenError extends Error {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Requires an authenticated session AND the given permission.
 * Used inside Server Components (pages/layouts): redirects on failure.
 */
export async function requirePermission(
  permission: Permission,
): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!hasPermission(ctx.role, permission)) {
    redirect("/dashboard?forbidden=1");
  }
  return ctx;
}

/**
 * Same as {@link requirePermission} but accepts several permissions and
 * succeeds if the user holds at least one of them.
 */
export async function requireAnyPermission(
  permissions: Permission[],
): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!hasAnyPermission(ctx.role, permissions)) {
    redirect("/dashboard?forbidden=1");
  }
  return ctx;
}

/**
 * Requires an authenticated session AND the given permission, but THROWS
 * instead of redirecting. Used inside Server Actions where a redirect is not
 * the desired failure mode.
 */
export async function assertPermission(
  permission: Permission,
): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!hasPermission(ctx.role, permission)) {
    throw new ForbiddenError();
  }
  return ctx;
}

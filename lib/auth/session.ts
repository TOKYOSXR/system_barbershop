import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth/auth";

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  barberId: string | null;
  name: string | null;
  email: string | null;
}

/**
 * Returns the authenticated session context, or `null` when there is no
 * session. The tenant is always derived from the session, never from client
 * input (section 29 of the requirements).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
    barberId: session.user.barberId,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

/** Like {@link getSessionContext} but redirects to /login when unauthenticated. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  return ctx;
}

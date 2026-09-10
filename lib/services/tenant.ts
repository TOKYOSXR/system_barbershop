import { prisma } from "@/lib/db/prisma";

/** Loads the tenant (barbershop) for the current session context. */
export function getTenantById(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });
}

/** Loads a tenant by its public slug (used by the public booking page). */
export function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
  });
}

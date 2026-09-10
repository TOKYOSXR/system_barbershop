import { prisma } from "@/lib/db/prisma";
import type { BarberInput } from "@/lib/validations/barber";

export interface ListBarbersParams {
  tenantId: string;
  query?: string;
  includeInactive?: boolean;
}

/** Tenant-scoped list of barbers (no pagination: teams are small). */
export function listBarbers({
  tenantId,
  query,
  includeInactive = false,
}: ListBarbersParams) {
  return prisma.barber.findMany({
    where: {
      tenantId,
      ...(includeInactive ? {} : { active: true }),
      ...(query
        ? { name: { contains: query, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export function getBarber(tenantId: string, id: string) {
  return prisma.barber.findFirst({ where: { id, tenantId } });
}

export function createBarber(tenantId: string, data: BarberInput) {
  return prisma.barber.create({
    data: {
      tenantId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      bio: data.bio || null,
      specialties: data.specialties,
      commissionPercentage: data.commissionPercentage,
      active: data.active,
    },
  });
}

export function updateBarber(tenantId: string, id: string, data: BarberInput) {
  return prisma.barber.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      bio: data.bio || null,
      specialties: data.specialties,
      commissionPercentage: data.commissionPercentage,
      active: data.active,
    },
  });
}

/** Soft delete: barbers are deactivated, never hard-deleted. */
export function deactivateBarber(tenantId: string, id: string) {
  return prisma.barber.updateMany({
    where: { id, tenantId },
    data: { active: false },
  });
}

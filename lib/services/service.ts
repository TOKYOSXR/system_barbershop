import { prisma } from "@/lib/db/prisma";
import type { ServiceInput } from "@/lib/validations/service";

export interface ListServicesParams {
  tenantId: string;
  query?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

/** Paginated, tenant-scoped list of services. */
export async function listServices({
  tenantId,
  query,
  includeInactive = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: ListServicesParams) {
  const where = {
    tenantId,
    ...(includeInactive ? {} : { active: true }),
    ...(query
      ? { name: { contains: query, mode: "insensitive" as const } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/** Tenant-scoped fetch of a single active/inactive service. */
export function getService(tenantId: string, id: string) {
  return prisma.service.findFirst({ where: { id, tenantId } });
}

export function createService(tenantId: string, data: ServiceInput) {
  return prisma.service.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
      durationMinutes: data.durationMinutes,
      price: data.price,
      active: data.active,
    },
  });
}

export function updateService(tenantId: string, id: string, data: ServiceInput) {
  // updateMany enforces the tenant scope in the WHERE clause.
  return prisma.service.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      description: data.description || null,
      durationMinutes: data.durationMinutes,
      price: data.price,
      active: data.active,
    },
  });
}

/** Soft delete: services are deactivated, never hard-deleted (section 32). */
export function deactivateService(tenantId: string, id: string) {
  return prisma.service.updateMany({
    where: { id, tenantId },
    data: { active: false },
  });
}

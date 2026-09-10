import { AppointmentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { CustomerInput } from "@/lib/validations/customer";

export interface ListCustomersParams {
  tenantId: string;
  query?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

/** Paginated, tenant-scoped list of customers with aggregated stats. */
export async function listCustomers({
  tenantId,
  query,
  includeInactive = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: ListCustomersParams) {
  const where: Prisma.CustomerWhereInput = {
    tenantId,
    ...(includeInactive ? {} : { active: true }),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  // Aggregate completed-appointment stats per listed customer in one query.
  const ids = customers.map((c) => c.id);
  const stats = ids.length
    ? await prisma.appointment.groupBy({
        by: ["customerId"],
        where: {
          tenantId,
          customerId: { in: ids },
          status: AppointmentStatus.COMPLETED,
        },
        _count: { _all: true },
        _sum: { price: true },
      })
    : [];

  const statsMap = new Map(
    stats.map((s) => [
      s.customerId,
      {
        visits: s._count._all,
        totalSpent: Number(s._sum.price ?? 0),
      },
    ]),
  );

  const items = customers.map((c) => ({
    ...c,
    visits: statsMap.get(c.id)?.visits ?? 0,
    totalSpent: statsMap.get(c.id)?.totalSpent ?? 0,
  }));

  return { items, total, page, pageSize };
}

/** Full customer profile with history and favorite service (section 19). */
export async function getCustomerProfile(tenantId: string, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
  });
  if (!customer) return null;

  const appointments = await prisma.appointment.findMany({
    where: { tenantId, customerId: id },
    orderBy: { startTime: "desc" },
    include: {
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
    take: 50,
  });

  const completed = appointments.filter(
    (a) => a.status === AppointmentStatus.COMPLETED,
  );
  const totalSpent = completed.reduce((sum, a) => sum + Number(a.price), 0);

  // Favorite service = most frequent among completed appointments.
  const serviceCounts = new Map<string, number>();
  for (const a of completed) {
    serviceCounts.set(
      a.service.name,
      (serviceCounts.get(a.service.name) ?? 0) + 1,
    );
  }
  let favoriteService: string | null = null;
  let max = 0;
  for (const [name, count] of serviceCounts) {
    if (count > max) {
      max = count;
      favoriteService = name;
    }
  }

  return {
    customer,
    appointments,
    stats: {
      visits: completed.length,
      totalSpent,
      favoriteService,
    },
  };
}

export function getCustomer(tenantId: string, id: string) {
  return prisma.customer.findFirst({ where: { id, tenantId } });
}

function parseBirthDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function createCustomer(tenantId: string, data: CustomerInput) {
  return prisma.customer.create({
    data: {
      tenantId,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      birthDate: parseBirthDate(data.birthDate),
      notes: data.notes || null,
    },
  });
}

export function updateCustomer(
  tenantId: string,
  id: string,
  data: CustomerInput,
) {
  return prisma.customer.updateMany({
    where: { id, tenantId },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      birthDate: parseBirthDate(data.birthDate),
      notes: data.notes || null,
    },
  });
}

/** Soft delete: customers are deactivated, never hard-deleted. */
export function deactivateCustomer(tenantId: string, id: string) {
  return prisma.customer.updateMany({
    where: { id, tenantId },
    data: { active: false },
  });
}

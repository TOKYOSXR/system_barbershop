import { prisma } from "@/lib/db/prisma";
import { startOfDayUTC } from "@/lib/availability/availability";
import { dateAtMinutes, parseHHmm } from "@/lib/availability/time";
import { parseISODate } from "@/lib/utils";
import type {
  BlockedTimeInput,
  WorkingHoursInput,
} from "@/lib/validations/schedule";

/** Returns the 7-day working hours for a barber (one row per weekday). */
export async function getWorkingHours(tenantId: string, barberId: string) {
  const rows = await prisma.workingHours.findMany({
    where: { tenantId, barberId },
    orderBy: { dayOfWeek: "asc" },
  });
  return rows;
}

/**
 * Replaces the full weekly schedule for a barber inside a transaction.
 * Inactive days simply have `active = false`.
 */
export async function saveWorkingHours(
  tenantId: string,
  data: WorkingHoursInput,
) {
  return prisma.$transaction(async (tx) => {
    await tx.workingHours.deleteMany({
      where: { tenantId, barberId: data.barberId },
    });
    await tx.workingHours.createMany({
      data: data.days.map((d) => ({
        tenantId,
        barberId: data.barberId,
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        active: d.active,
      })),
    });
  });
}

export function listBlockedTimes(
  tenantId: string,
  barberId?: string,
  from?: Date,
) {
  return prisma.blockedTime.findMany({
    where: {
      tenantId,
      ...(barberId ? { barberId } : {}),
      ...(from ? { date: { gte: startOfDayUTC(from) } } : {}),
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: { barber: { select: { name: true } } },
  });
}

export function createBlockedTime(tenantId: string, data: BlockedTimeInput) {
  // Parse "yyyy-MM-dd" as a LOCAL day (not UTC) so the calendar date and the
  // start/end times stay on the same day the user selected.
  const day = parseISODate(data.date);
  const startMin = parseHHmm(data.startTime)!;
  const endMin = parseHHmm(data.endTime)!;

  return prisma.blockedTime.create({
    data: {
      tenantId,
      barberId: data.barberId,
      date: startOfDayUTC(day),
      startTime: dateAtMinutes(day, startMin),
      endTime: dateAtMinutes(day, endMin),
      reason: data.reason || null,
    },
  });
}

export function deleteBlockedTime(tenantId: string, id: string) {
  return prisma.blockedTime.deleteMany({ where: { id, tenantId } });
}

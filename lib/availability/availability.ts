import { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  dateAtMinutes,
  minutesOfDay,
  parseHHmm,
  type Interval,
} from "@/lib/availability/time";
import {
  computeAvailableSlots,
  isSlotAvailable,
} from "@/lib/availability/slots";

/** Statuses that occupy the barber's time (block a slot). */
const BLOCKING_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
];

export interface AvailabilityQuery {
  tenantId: string;
  barberId: string;
  serviceId: string;
  /** Target calendar day (local). Only y/m/d are used. */
  day: Date;
  /** Appointment being edited (excluded from busy set), optional. */
  excludeAppointmentId?: string;
}

interface DayContext {
  workingIntervals: Interval[];
  busyIntervals: Interval[];
  durationMinutes: number;
  stepMinutes: number;
  minStartMinutes: number;
}

/**
 * Loads working hours, blocked times and existing appointments for a barber on
 * a given day and assembles the intervals needed by the slot engine.
 */
async function loadDayContext(
  q: AvailabilityQuery,
): Promise<DayContext | null> {
  const { tenantId, barberId, serviceId, day } = q;

  const [tenant, service, workingHours, blocks, appointments] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slotIntervalMinutes: true, minLeadTimeMinutes: true },
      }),
      prisma.service.findFirst({
        where: { id: serviceId, tenantId },
        select: { durationMinutes: true },
      }),
      prisma.workingHours.findMany({
        where: {
          tenantId,
          barberId,
          dayOfWeek: day.getDay(),
          active: true,
        },
      }),
      prisma.blockedTime.findMany({
        where: { tenantId, barberId, date: startOfDayUTC(day) },
      }),
      prisma.appointment.findMany({
        where: {
          tenantId,
          barberId,
          date: startOfDayUTC(day),
          status: { in: BLOCKING_STATUSES },
          ...(q.excludeAppointmentId
            ? { id: { not: q.excludeAppointmentId } }
            : {}),
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

  if (!tenant || !service) return null;

  const workingIntervals: Interval[] = [];
  for (const wh of workingHours) {
    const start = parseHHmm(wh.startTime);
    const end = parseHHmm(wh.endTime);
    if (start !== null && end !== null && end > start) {
      workingIntervals.push({ start, end });
    }
  }

  const busyIntervals: Interval[] = [
    ...blocks.map((b) => ({
      start: minutesOfDay(b.startTime),
      end: minutesOfDay(b.endTime),
    })),
    ...appointments.map((a) => ({
      start: minutesOfDay(a.startTime),
      end: minutesOfDay(a.endTime),
    })),
  ];

  // Lead-time cutoff: if the day is today, disallow slots earlier than
  // now + minLeadTime. For future days, no cutoff.
  const now = new Date();
  const isToday =
    now.getFullYear() === day.getFullYear() &&
    now.getMonth() === day.getMonth() &&
    now.getDate() === day.getDate();
  const minStartMinutes = isToday
    ? minutesOfDay(now) + tenant.minLeadTimeMinutes
    : 0;

  return {
    workingIntervals,
    busyIntervals,
    durationMinutes: service.durationMinutes,
    stepMinutes: tenant.slotIntervalMinutes || 30,
    minStartMinutes,
  };
}

/**
 * Returns the available start times for a barber/service/day as Date objects
 * (local time on the target day). This is what the booking UI consumes.
 */
export async function getAvailableSlots(
  q: AvailabilityQuery,
): Promise<Date[]> {
  const ctx = await loadDayContext(q);
  if (!ctx) return [];

  const minutes = computeAvailableSlots({
    workingIntervals: ctx.workingIntervals,
    busyIntervals: ctx.busyIntervals,
    durationMinutes: ctx.durationMinutes,
    stepMinutes: ctx.stepMinutes,
    minStartMinutes: ctx.minStartMinutes,
  });

  return minutes.map((m) => dateAtMinutes(q.day, m));
}

/**
 * Server-side final check before persisting a booking. Recomputes the day
 * context and verifies the requested interval is still free. Prevents double
 * booking under race conditions (section 12).
 */
export async function verifySlotAvailable(
  q: AvailabilityQuery,
  startTime: Date,
  endTime: Date,
): Promise<boolean> {
  const ctx = await loadDayContext(q);
  if (!ctx) return false;

  const candidate: Interval = {
    start: minutesOfDay(startTime),
    end: minutesOfDay(endTime),
  };

  return isSlotAvailable(candidate, ctx.workingIntervals, ctx.busyIntervals);
}

/** Normalizes a local day to the UTC midnight used by the `date` (@db.Date) column. */
export function startOfDayUTC(day: Date): Date {
  return new Date(
    Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()),
  );
}

import { AppointmentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  getAvailableSlots,
  startOfDayUTC,
  verifySlotAvailable,
} from "@/lib/availability/availability";
import { dateAtMinutes, parseHHmm } from "@/lib/availability/time";
import { parseISODate } from "@/lib/utils";
import type { AppointmentInput } from "@/lib/validations/appointment";

export class BookingConflictError extends Error {
  constructor(message = "Este horário não está mais disponível.") {
    super(message);
    this.name = "BookingConflictError";
  }
}

export const appointmentInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  barber: { select: { id: true, name: true } },
  service: { select: { id: true, name: true, durationMinutes: true } },
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export interface ListAppointmentsParams {
  tenantId: string;
  from: Date;
  to: Date;
  barberId?: string;
  /** Restrict to a single barber (used for the BARBER role). */
  onlyBarberId?: string;
}

/** Lists appointments in a date range for the calendar views. */
export function listAppointments({
  tenantId,
  from,
  to,
  barberId,
  onlyBarberId,
}: ListAppointmentsParams) {
  return prisma.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: from, lt: to },
      ...(onlyBarberId
        ? { barberId: onlyBarberId }
        : barberId
          ? { barberId }
          : {}),
    },
    orderBy: { startTime: "asc" },
    include: appointmentInclude,
  });
}

export function getAppointment(tenantId: string, id: string) {
  return prisma.appointment.findFirst({
    where: { id, tenantId },
    include: appointmentInclude,
  });
}

/**
 * Creates an appointment after verifying the slot is free. The service price
 * and end time are derived server-side (never trusted from the client).
 */
export async function createAppointment(
  tenantId: string,
  data: AppointmentInput,
): Promise<AppointmentWithRelations> {
  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, tenantId, active: true },
    select: { durationMinutes: true, price: true },
  });
  if (!service) throw new BookingConflictError("Serviço indisponível.");

  const day = parseISODate(data.date);
  const startMin = parseHHmm(data.startTime);
  if (startMin === null) throw new BookingConflictError("Horário inválido.");

  const startTime = dateAtMinutes(day, startMin);
  const endTime = dateAtMinutes(day, startMin + service.durationMinutes);

  const available = await verifySlotAvailable(
    { tenantId, barberId: data.barberId, serviceId: data.serviceId, day },
    startTime,
    endTime,
  );
  if (!available) throw new BookingConflictError();

  return prisma.appointment.create({
    data: {
      tenantId,
      customerId: data.customerId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      date: startOfDayUTC(day),
      startTime,
      endTime,
      price: service.price,
      notes: data.notes || null,
      status: AppointmentStatus.SCHEDULED,
    },
    include: appointmentInclude,
  });
}

/**
 * Updates the schedule of an existing appointment (barber/service/date/time),
 * re-verifying availability while excluding the appointment itself.
 */
export async function rescheduleAppointment(
  tenantId: string,
  id: string,
  data: AppointmentInput,
): Promise<AppointmentWithRelations> {
  const existing = await prisma.appointment.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) throw new BookingConflictError("Agendamento não encontrado.");

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, tenantId },
    select: { durationMinutes: true, price: true },
  });
  if (!service) throw new BookingConflictError("Serviço indisponível.");

  const day = parseISODate(data.date);
  const startMin = parseHHmm(data.startTime);
  if (startMin === null) throw new BookingConflictError("Horário inválido.");

  const startTime = dateAtMinutes(day, startMin);
  const endTime = dateAtMinutes(day, startMin + service.durationMinutes);

  const available = await verifySlotAvailable(
    {
      tenantId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      day,
      excludeAppointmentId: id,
    },
    startTime,
    endTime,
  );
  if (!available) throw new BookingConflictError();

  await prisma.appointment.updateMany({
    where: { id, tenantId },
    data: {
      customerId: data.customerId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      date: startOfDayUTC(day),
      startTime,
      endTime,
      price: service.price,
      notes: data.notes || null,
    },
  });

  return (await getAppointment(tenantId, id))!;
}

/** Re-export for the booking UI. */
export { getAvailableSlots };

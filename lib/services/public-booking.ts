import { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  getAvailableSlots,
  startOfDayUTC,
  verifySlotAvailable,
} from "@/lib/availability/availability";
import { dateAtMinutes, parseHHmm } from "@/lib/availability/time";
import { parseISODate } from "@/lib/utils";
import { BookingConflictError } from "@/lib/services/appointment";
import type { PublicBookingInput } from "@/lib/validations/public-booking";

/** Public tenant info exposed on the booking page (safe fields only). */
export async function getPublicTenant(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      phone: true,
      address: true,
      city: true,
      state: true,
    },
  });
  return tenant;
}

/** Active services offered by the tenant, for the public page. */
export function getPublicServices(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, durationMinutes: true, price: true },
    orderBy: { name: "asc" },
  });
}

/** Active barbers of the tenant, for the public page. */
export function getPublicBarbers(tenantId: string) {
  return prisma.barber.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, avatar: true, specialties: true },
    orderBy: { name: "asc" },
  });
}

/** Available slot start times ("HH:mm") for the public flow. */
export async function getPublicSlots(
  tenantId: string,
  barberId: string,
  serviceId: string,
  day: Date,
): Promise<string[]> {
  const slots = await getAvailableSlots({
    tenantId,
    barberId,
    serviceId,
    day,
  });
  return slots.map(
    (d) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`,
  );
}

export interface PublicBookingResult {
  tenantId: string;
  appointmentId: string;
  serviceName: string;
  barberName: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Creates a booking coming from the public page. The tenant is resolved from
 * the slug (never trusted from the client). The customer is upserted by phone.
 */
export async function createPublicBooking(
  data: PublicBookingInput,
): Promise<PublicBookingResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (!tenant) throw new BookingConflictError("Barbearia não encontrada.");
  const tenantId = tenant.id;

  const [service, barber] = await Promise.all([
    prisma.service.findFirst({
      where: { id: data.serviceId, tenantId, active: true },
      select: { durationMinutes: true, price: true, name: true },
    }),
    prisma.barber.findFirst({
      where: { id: data.barberId, tenantId, active: true },
      select: { name: true },
    }),
  ]);
  if (!service) throw new BookingConflictError("Serviço indisponível.");
  if (!barber) throw new BookingConflictError("Barbeiro indisponível.");

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

  const normalizedPhone = data.customerPhone.trim();

  const appointmentId = await prisma.$transaction(async (tx) => {
    // Upsert the customer by (tenantId, phone).
    const existing = await tx.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone: normalizedPhone } },
      select: { id: true },
    });

    const customer = existing
      ? await tx.customer.update({
          where: { id: existing.id },
          data: {
            name: data.customerName,
            email: data.customerEmail || undefined,
          },
        })
      : await tx.customer.create({
          data: {
            tenantId,
            name: data.customerName,
            phone: normalizedPhone,
            email: data.customerEmail || null,
          },
        });

    const appt = await tx.appointment.create({
      data: {
        tenantId,
        customerId: customer.id,
        barberId: data.barberId,
        serviceId: data.serviceId,
        date: startOfDayUTC(day),
        startTime,
        endTime,
        price: service.price,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    return appt.id;
  });

  return {
    tenantId,
    appointmentId,
    serviceName: service.name,
    barberName: barber.name,
    startTime,
    endTime,
  };
}

"use server";

import { headers } from "next/headers";

import { publicBookingSchema } from "@/lib/validations/public-booking";
import {
  createPublicBooking,
  getPublicSlots,
  getPublicTenant,
} from "@/lib/services/public-booking";
import { BookingConflictError } from "@/lib/services/appointment";
import { queueNotification } from "@/lib/services/notification";
import { canCreateAppointment } from "@/lib/services/plan";
import { parseISODate } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { runAction, type ActionResult } from "@/lib/actions/result";

async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

/** Public: list available slots for a barber/service/day. */
export async function getPublicSlotsAction(
  slug: string,
  barberId: string,
  serviceId: string,
  dateISO: string,
): Promise<ActionResult<string[]>> {
  return runAction(async () => {
    const limited = rateLimit(await clientKey("slots"), 60, 60_000);
    if (!limited.allowed) {
      return { success: false, error: "Muitas requisições. Aguarde um pouco." };
    }

    const tenant = await getPublicTenant(slug);
    if (!tenant) return { success: false, error: "Barbearia não encontrada." };

    const day = parseISODate(dateISO);
    if (Number.isNaN(day.getTime())) {
      return { success: false, error: "Data inválida." };
    }

    const slots = await getPublicSlots(tenant.id, barberId, serviceId, day);
    return { success: true, data: slots };
  });
}

export interface PublicBookingConfirmation {
  serviceName: string;
  barberName: string;
  startISO: string;
  endISO: string;
}

/** Public: create a booking from the public page. */
export async function createPublicBookingAction(
  input: unknown,
): Promise<ActionResult<PublicBookingConfirmation>> {
  return runAction(async () => {
    const limited = rateLimit(await clientKey("book"), 10, 60_000);
    if (!limited.allowed) {
      return {
        success: false,
        error: "Muitas tentativas. Tente novamente em instantes.",
      };
    }

    const parsed = publicBookingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const tenant = await getPublicTenant(parsed.data.slug);
    if (!tenant) return { success: false, error: "Barbearia não encontrada." };
    if (!(await canCreateAppointment(tenant.id))) {
      return {
        success: false,
        error: "Agendamentos indisponíveis no momento. Tente mais tarde.",
      };
    }

    try {
      const result = await createPublicBooking(parsed.data);
      await queueNotification({
        tenantId: result.tenantId,
        appointmentId: result.appointmentId,
        type: "APPOINTMENT_CREATED",
        sendNow: true,
      });
      return {
        success: true,
        data: {
          serviceName: result.serviceName,
          barberName: result.barberName,
          startISO: result.startTime.toISOString(),
          endISO: result.endTime.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof BookingConflictError) {
        return { success: false, error: error.message };
      }
      throw error;
    }
  });
}

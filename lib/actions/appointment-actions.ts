"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import {
  appointmentSchema,
  updateStatusSchema,
} from "@/lib/validations/appointment";
import {
  BookingConflictError,
  createAppointment,
  getAppointment,
  getAvailableSlots,
  rescheduleAppointment,
} from "@/lib/services/appointment";
import { changeAppointmentStatus } from "@/lib/services/appointment-status";
import { recordAudit } from "@/lib/services/audit";
import { queueNotification } from "@/lib/services/notification";
import { canCreateAppointment } from "@/lib/services/plan";
import { parseISODate } from "@/lib/utils";
import { runAction, type ActionResult } from "@/lib/actions/result";
import type { AppointmentStatus, NotificationType } from "@prisma/client";

/** Maps an appointment status to the notification to fire, if any. */
const STATUS_NOTIFICATION: Partial<
  Record<AppointmentStatus, NotificationType>
> = {
  CONFIRMED: "APPOINTMENT_CONFIRMED",
  CANCELLED: "APPOINTMENT_CANCELLED",
  COMPLETED: "APPOINTMENT_COMPLETED",
};

/** Public-ish helper used by the internal booking form to list free times. */
export async function getSlotsAction(
  barberId: string,
  serviceId: string,
  dateISO: string,
): Promise<ActionResult<string[]>> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:view");
    const day = parseISODate(dateISO);
    if (Number.isNaN(day.getTime())) {
      return { success: false, error: "Data inválida." };
    }
    const slots = await getAvailableSlots({
      tenantId: ctx.tenantId,
      barberId,
      serviceId,
      day,
    });
    return {
      success: true,
      data: slots.map((d) =>
        `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes(),
        ).padStart(2, "0")}`,
      ),
    };
  });
}

export async function createAppointmentAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:manage");
    const parsed = appointmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (!(await canCreateAppointment(ctx.tenantId))) {
      return {
        success: false,
        error:
          "Limite de agendamentos do plano atingido neste mês. Faça upgrade para continuar.",
      };
    }

    try {
      const appt = await createAppointment(ctx.tenantId, parsed.data);
      await recordAudit({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "create",
        entity: "Appointment",
        entityId: appt.id,
      });
      await queueNotification({
        tenantId: ctx.tenantId,
        appointmentId: appt.id,
        type: "APPOINTMENT_CREATED",
        sendNow: true,
      });
    } catch (error) {
      if (error instanceof BookingConflictError) {
        return { success: false, error: error.message };
      }
      throw error;
    }

    revalidatePath("/agendamentos");
    return { success: true };
  });
}

export async function updateAppointmentAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:manage");
    const parsed = appointmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    try {
      await rescheduleAppointment(ctx.tenantId, id, parsed.data);
      await recordAudit({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "update",
        entity: "Appointment",
        entityId: id,
      });
    } catch (error) {
      if (error instanceof BookingConflictError) {
        return { success: false, error: error.message };
      }
      throw error;
    }

    revalidatePath("/agendamentos");
    return { success: true };
  });
}

/**
 * Changes an appointment status. BARBER may only change their own
 * appointments (appointments:manage_own); ADMIN/OWNER may change any.
 */
export async function changeStatusAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:view");
    const canManageAll = hasPermission(ctx.role, "appointments:manage");
    const canManageOwn = hasPermission(ctx.role, "appointments:manage_own");
    if (!canManageAll && !canManageOwn) {
      return { success: false, error: "Sem permissão." };
    }

    const parsed = updateStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const appt = await getAppointment(ctx.tenantId, id);
    if (!appt) return { success: false, error: "Agendamento não encontrado." };

    // A barber can only touch their own appointments.
    if (!canManageAll && appt.barber.id !== ctx.barberId) {
      return { success: false, error: "Sem permissão para este agendamento." };
    }

    const result = await changeAppointmentStatus(ctx.tenantId, id, parsed.data);
    if (result.notFound) {
      return { success: false, error: "Agendamento não encontrado." };
    }

    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: `status:${result.nextStatus}`,
      entity: "Appointment",
      entityId: id,
      oldData: { status: result.previousStatus },
      newData: { status: result.nextStatus },
    });

    const notificationType = STATUS_NOTIFICATION[result.nextStatus];
    if (notificationType) {
      await queueNotification({
        tenantId: ctx.tenantId,
        appointmentId: id,
        type: notificationType,
        sendNow: true,
      });
    }

    revalidatePath("/agendamentos");
    revalidatePath("/financeiro");
    revalidatePath("/dashboard");
    return { success: true };
  });
}

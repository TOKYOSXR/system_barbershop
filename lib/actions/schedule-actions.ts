"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/permissions/guard";
import {
  blockedTimeSchema,
  workingHoursSchema,
} from "@/lib/validations/schedule";
import {
  createBlockedTime,
  deleteBlockedTime,
  getWorkingHours,
  listBlockedTimes,
  saveWorkingHours,
} from "@/lib/services/schedule";
import { recordAudit } from "@/lib/services/audit";
import { runAction, type ActionResult } from "@/lib/actions/result";

export interface WorkingHoursDay {
  dayOfWeek: number;
  active: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

/**
 * Returns a normalized 7-day schedule for a barber. Days without a saved row
 * default to inactive with standard hours, so the UI always renders 7 rows.
 */
export async function getWorkingHoursAction(
  barberId: string,
): Promise<ActionResult<WorkingHoursDay[]>> {
  return runAction(async () => {
    const ctx = await assertPermission("barbers:view");
    const rows = await getWorkingHours(ctx.tenantId, barberId);
    const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));

    const days: WorkingHoursDay[] = Array.from({ length: 7 }, (_, dow) => {
      const row = byDay.get(dow);
      return {
        dayOfWeek: dow,
        active: row?.active ?? false,
        startTime: row?.startTime ?? DEFAULT_START,
        endTime: row?.endTime ?? DEFAULT_END,
      };
    });

    return { success: true, data: days };
  });
}

export async function saveWorkingHoursAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("barbers:manage");
    const parsed = workingHoursSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await saveWorkingHours(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entity: "WorkingHours",
      entityId: parsed.data.barberId,
    });

    revalidatePath("/barbeiros");
    revalidatePath("/configuracoes");
    return { success: true };
  });
}

export interface BlockedTimeRow {
  id: string;
  barberId: string;
  barberName: string;
  date: string; // ISO date
  startTime: string; // ISO
  endTime: string; // ISO
  reason: string | null;
}

/** Lists upcoming blocked times (from today onward), tenant-scoped. */
export async function listBlockedTimesAction(
  barberId?: string,
): Promise<ActionResult<BlockedTimeRow[]>> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:view");
    const rows = await listBlockedTimes(
      ctx.tenantId,
      barberId || undefined,
      new Date(),
    );
    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        barberId: r.barberId,
        barberName: r.barber.name,
        date: r.date.toISOString(),
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        reason: r.reason,
      })),
    };
  });
}

export async function createBlockedTimeAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:manage");
    const parsed = blockedTimeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const block = await createBlockedTime(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entity: "BlockedTime",
      entityId: block.id,
    });

    revalidatePath("/agendamentos");
    revalidatePath("/agendamentos/bloqueios");
    return { success: true };
  });
}

export async function deleteBlockedTimeAction(
  id: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("appointments:manage");
    await deleteBlockedTime(ctx.tenantId, id);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "delete",
      entity: "BlockedTime",
      entityId: id,
    });

    revalidatePath("/agendamentos");
    revalidatePath("/agendamentos/bloqueios");
    return { success: true };
  });
}

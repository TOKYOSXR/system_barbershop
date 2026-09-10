"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/permissions/guard";
import { barberSchema } from "@/lib/validations/barber";
import {
  createBarber,
  deactivateBarber,
  getBarber,
  updateBarber,
} from "@/lib/services/barber";
import { recordAudit } from "@/lib/services/audit";
import { canAddBarber } from "@/lib/services/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { getTenantPlan } from "@/lib/services/plan";
import { runAction, type ActionResult } from "@/lib/actions/result";

export async function createBarberAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("barbers:manage");
    const parsed = barberSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Enforce plan barber limit (section 28).
    if (parsed.data.active !== false && !(await canAddBarber(ctx.tenantId))) {
      const plan = await getTenantPlan(ctx.tenantId);
      const max = PLAN_LIMITS[plan].maxBarbers;
      return {
        success: false,
        error: `Seu plano permite até ${max} barbeiro(s). Faça upgrade para adicionar mais.`,
      };
    }

    const barber = await createBarber(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entity: "Barber",
      entityId: barber.id,
      newData: {
        name: barber.name,
        commissionPercentage: Number(barber.commissionPercentage),
      },
    });

    revalidatePath("/barbeiros");
    return { success: true };
  });
}

export async function updateBarberAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("barbers:manage");
    const parsed = barberSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const before = await getBarber(ctx.tenantId, id);
    if (!before) return { success: false, error: "Barbeiro não encontrado." };

    await updateBarber(ctx.tenantId, id, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entity: "Barber",
      entityId: id,
      oldData: {
        name: before.name,
        commissionPercentage: Number(before.commissionPercentage),
      },
      newData: {
        name: parsed.data.name,
        commissionPercentage: parsed.data.commissionPercentage,
      },
    });

    revalidatePath("/barbeiros");
    return { success: true };
  });
}

export async function deactivateBarberAction(
  id: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("barbers:manage");
    const before = await getBarber(ctx.tenantId, id);
    if (!before) return { success: false, error: "Barbeiro não encontrado." };

    await deactivateBarber(ctx.tenantId, id);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "deactivate",
      entity: "Barber",
      entityId: id,
    });

    revalidatePath("/barbeiros");
    return { success: true };
  });
}

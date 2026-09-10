"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/permissions/guard";
import {
  bookingRulesSchema,
  tenantInfoSchema,
} from "@/lib/validations/settings";
import {
  updateBookingRules,
  updateTenantInfo,
} from "@/lib/services/settings";
import { recordAudit } from "@/lib/services/audit";
import { runAction, type ActionResult } from "@/lib/actions/result";

export async function updateTenantInfoAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("settings:manage");
    const parsed = tenantInfoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await updateTenantInfo(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entity: "TenantInfo",
      entityId: ctx.tenantId,
      newData: { name: parsed.data.name },
    });

    revalidatePath("/configuracoes");
    return { success: true };
  });
}

export async function updateBookingRulesAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("settings:manage");
    const parsed = bookingRulesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await updateBookingRules(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entity: "BookingRules",
      entityId: ctx.tenantId,
      newData: { ...parsed.data },
    });

    revalidatePath("/configuracoes");
    return { success: true };
  });
}

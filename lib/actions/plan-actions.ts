"use server";

import { revalidatePath } from "next/cache";
import { PlanType } from "@prisma/client";

import { assertPermission } from "@/lib/permissions/guard";
import { changePlan } from "@/lib/services/plan";
import { recordAudit } from "@/lib/services/audit";
import { runAction, type ActionResult } from "@/lib/actions/result";

/**
 * Changes the tenant plan. In this MVP there is no real charge; this is the
 * seam where a Stripe/Mercado Pago checkout + webhook would plug in.
 * Restricted to OWNER (billing:manage).
 */
export async function changePlanAction(plan: string): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("billing:manage");

    if (!Object.values(PlanType).includes(plan as PlanType)) {
      return { success: false, error: "Plano inválido." };
    }

    await changePlan(ctx.tenantId, plan as PlanType);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "plan:change",
      entity: "Subscription",
      entityId: ctx.tenantId,
      newData: { plan },
    });

    revalidatePath("/configuracoes/planos");
    return { success: true };
  });
}

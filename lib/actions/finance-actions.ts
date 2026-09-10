"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/permissions/guard";
import { expenseSchema } from "@/lib/validations/finance";
import {
  createExpense,
  deleteExpense,
  markCommissionPaid,
} from "@/lib/services/finance";
import { recordAudit } from "@/lib/services/audit";
import { runAction, type ActionResult } from "@/lib/actions/result";

export async function markCommissionPaidAction(
  id: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("finance:manage");
    await markCommissionPaid(ctx.tenantId, id);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "commission:paid",
      entity: "Commission",
      entityId: id,
    });
    revalidatePath("/financeiro");
    return { success: true };
  });
}

export async function createExpenseAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("finance:manage");
    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const expense = await createExpense(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entity: "Expense",
      entityId: expense.id,
      newData: {
        amount: Number(expense.amount),
        description: expense.description,
      },
    });
    revalidatePath("/financeiro");
    revalidatePath("/dashboard");
    return { success: true };
  });
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("finance:manage");
    await deleteExpense(ctx.tenantId, id);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "delete",
      entity: "Expense",
      entityId: id,
    });
    revalidatePath("/financeiro");
    revalidatePath("/dashboard");
    return { success: true };
  });
}

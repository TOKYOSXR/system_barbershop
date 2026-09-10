"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/permissions/guard";
import { serviceSchema } from "@/lib/validations/service";
import {
  createService,
  deactivateService,
  getService,
  updateService,
} from "@/lib/services/service";
import { recordAudit } from "@/lib/services/audit";
import { runAction, type ActionResult } from "@/lib/actions/result";

export async function createServiceAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("services:manage");
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const service = await createService(ctx.tenantId, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "create",
      entity: "Service",
      entityId: service.id,
      newData: { name: service.name, price: Number(service.price) },
    });

    revalidatePath("/servicos");
    return { success: true };
  });
}

export async function updateServiceAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("services:manage");
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const before = await getService(ctx.tenantId, id);
    if (!before) return { success: false, error: "Serviço não encontrado." };

    await updateService(ctx.tenantId, id, parsed.data);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entity: "Service",
      entityId: id,
      oldData: { name: before.name, price: Number(before.price) },
      newData: { name: parsed.data.name, price: parsed.data.price },
    });

    revalidatePath("/servicos");
    return { success: true };
  });
}

export async function deactivateServiceAction(
  id: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("services:manage");
    const before = await getService(ctx.tenantId, id);
    if (!before) return { success: false, error: "Serviço não encontrado." };

    await deactivateService(ctx.tenantId, id);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "deactivate",
      entity: "Service",
      entityId: id,
    });

    revalidatePath("/servicos");
    return { success: true };
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { assertPermission } from "@/lib/permissions/guard";
import { customerSchema } from "@/lib/validations/customer";
import {
  createCustomer,
  deactivateCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/services/customer";
import { recordAudit } from "@/lib/services/audit";
import { runAction, type ActionResult } from "@/lib/actions/result";

export async function createCustomerAction(
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("customers:manage");
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    try {
      const customer = await createCustomer(ctx.tenantId, parsed.data);
      await recordAudit({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "create",
        entity: "Customer",
        entityId: customer.id,
        newData: { name: customer.name, phone: customer.phone },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          success: false,
          error: "Já existe um cliente com este telefone.",
        };
      }
      throw error;
    }

    revalidatePath("/clientes");
    return { success: true };
  });
}

export async function updateCustomerAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("customers:manage");
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const before = await getCustomer(ctx.tenantId, id);
    if (!before) return { success: false, error: "Cliente não encontrado." };

    try {
      await updateCustomer(ctx.tenantId, id, parsed.data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          success: false,
          error: "Já existe um cliente com este telefone.",
        };
      }
      throw error;
    }

    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "update",
      entity: "Customer",
      entityId: id,
      oldData: { name: before.name, phone: before.phone },
      newData: { name: parsed.data.name, phone: parsed.data.phone },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: true };
  });
}

export async function deactivateCustomerAction(
  id: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const ctx = await assertPermission("customers:manage");
    const before = await getCustomer(ctx.tenantId, id);
    if (!before) return { success: false, error: "Cliente não encontrado." };

    await deactivateCustomer(ctx.tenantId, id);
    await recordAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "deactivate",
      entity: "Customer",
      entityId: id,
    });

    revalidatePath("/clientes");
    return { success: true };
  });
}

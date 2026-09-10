"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Registers a new barbershop: creates the Tenant, the OWNER User and a default
 * FREE Subscription inside a single transaction so the data stays consistent.
 */
export async function registerBarbershop(
  input: unknown,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const { barbershopName, name, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "Este email já está em uso." };
  }

  const passwordHash = await hashPassword(password);
  const slug = await generateUniqueSlug(barbershopName);

  try {
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: barbershopName,
          slug,
          email,
          subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        },
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          passwordHash,
          role: "OWNER",
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "Este email já está em uso." };
    }
    console.error("registerBarbershop failed", error);
    return {
      success: false,
      error: "Não foi possível criar a conta. Tente novamente.",
    };
  }
}

/** Generate a slug that is unique across tenants. */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "barbearia";
  let candidate = base;
  let suffix = 1;

  // Loop is bounded in practice; slugs collide rarely.
  while (
    await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

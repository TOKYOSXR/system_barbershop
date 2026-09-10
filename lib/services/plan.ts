import { AppointmentStatus, type PlanType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { PLAN_LIMITS } from "@/lib/constants";
import { startOfMonth } from "@/lib/utils";

export interface PlanUsage {
  plan: PlanType;
  barbers: number;
  maxBarbers: number | null;
  appointmentsThisMonth: number;
  maxAppointmentsPerMonth: number | null;
}

/** Returns the tenant's current plan (defaults to FREE if no subscription). */
export async function getTenantPlan(tenantId: string): Promise<PlanType> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { plan: true },
  });
  return sub?.plan ?? "FREE";
}

/** Current plan + usage counters (for the billing page and enforcement). */
export async function getPlanUsage(tenantId: string): Promise<PlanUsage> {
  const [plan, barbers, appointmentsThisMonth] = await Promise.all([
    getTenantPlan(tenantId),
    prisma.barber.count({ where: { tenantId, active: true } }),
    prisma.appointment.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth(new Date()) },
        status: { not: AppointmentStatus.CANCELLED },
      },
    }),
  ]);

  const limits = PLAN_LIMITS[plan];
  return {
    plan,
    barbers,
    maxBarbers: limits.maxBarbers,
    appointmentsThisMonth,
    maxAppointmentsPerMonth: limits.maxAppointmentsPerMonth,
  };
}

/** Throws-free check: can the tenant add another active barber? */
export async function canAddBarber(tenantId: string): Promise<boolean> {
  const plan = await getTenantPlan(tenantId);
  const max = PLAN_LIMITS[plan].maxBarbers;
  if (max === null) return true;
  const count = await prisma.barber.count({
    where: { tenantId, active: true },
  });
  return count < max;
}

/** Throws-free check: can the tenant create another appointment this month? */
export async function canCreateAppointment(
  tenantId: string,
): Promise<boolean> {
  const plan = await getTenantPlan(tenantId);
  const max = PLAN_LIMITS[plan].maxAppointmentsPerMonth;
  if (max === null) return true;
  const count = await prisma.appointment.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth(new Date()) },
      status: { not: AppointmentStatus.CANCELLED },
    },
  });
  return count < max;
}

/**
 * Changes the tenant plan. Billing integration (Stripe/Mercado Pago) is
 * architecturally prepared: this simply upserts the Subscription. When a real
 * gateway is wired, this becomes the post-checkout webhook handler.
 */
export async function changePlan(tenantId: string, plan: PlanType) {
  return prisma.subscription.upsert({
    where: { tenantId },
    create: { tenantId, plan, status: "ACTIVE" },
    update: { plan, status: "ACTIVE" },
  });
}

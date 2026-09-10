import { prisma } from "@/lib/db/prisma";
import type {
  BookingRulesInput,
  TenantInfoInput,
} from "@/lib/validations/settings";

/** Loads the full tenant record for the settings screen. */
export function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      minLeadTimeMinutes: true,
      maxFutureDays: true,
      allowCancellation: true,
      minCancelTimeMinutes: true,
      slotIntervalMinutes: true,
    },
  });
}

export function updateTenantInfo(tenantId: string, data: TenantInfoInput) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
    },
  });
}

export function updateBookingRules(tenantId: string, data: BookingRulesInput) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      minLeadTimeMinutes: data.minLeadTimeMinutes,
      maxFutureDays: data.maxFutureDays,
      allowCancellation: data.allowCancellation,
      minCancelTimeMinutes: data.minCancelTimeMinutes,
      slotIntervalMinutes: data.slotIntervalMinutes,
    },
  });
}

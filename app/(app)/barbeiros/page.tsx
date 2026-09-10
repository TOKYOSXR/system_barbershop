import { requirePermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { listBarbers } from "@/lib/services/barber";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarbersClient } from "@/components/barbers/barbers-client";
import type { BarberFormValue } from "@/components/barbers/barber-form-dialog";

export default async function BarbersPage() {
  const ctx = await requirePermission("barbers:view");
  const canManage = hasPermission(ctx.role, "barbers:manage");

  const barbers = await listBarbers({
    tenantId: ctx.tenantId,
    includeInactive: canManage,
  });

  const serialized: BarberFormValue[] = barbers.map((b) => ({
    id: b.id,
    name: b.name,
    phone: b.phone,
    email: b.email,
    bio: b.bio,
    specialties: b.specialties,
    commissionPercentage: Number(b.commissionPercentage),
    active: b.active,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader title="Barbeiros" description="Gerencie a sua equipe." />
      <BarbersClient items={serialized} canManage={canManage} />
    </div>
  );
}

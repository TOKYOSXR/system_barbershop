import { requirePermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { listServices } from "@/lib/services/service";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServicesClient } from "@/components/services/services-client";

export default async function ServicesPage({
  searchParams,
}: PageProps<"/servicos">) {
  const ctx = await requirePermission("services:view");
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : undefined;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const canManage = hasPermission(ctx.role, "services:manage");

  const { items, total, pageSize } = await listServices({
    tenantId: ctx.tenantId,
    query,
    includeInactive: canManage,
    page,
  });

  const serialized = items.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    active: s.active,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços oferecidos."
      />
      <ServicesClient
        items={serialized}
        total={total}
        page={page}
        pageSize={pageSize}
        canManage={canManage}
      />
    </div>
  );
}

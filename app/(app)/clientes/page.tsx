import { requirePermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { listCustomers } from "@/lib/services/customer";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  CustomersClient,
  type CustomerListItem,
} from "@/components/customers/customers-client";

function toDateInput(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export default async function CustomersPage({
  searchParams,
}: PageProps<"/clientes">) {
  const ctx = await requirePermission("customers:view");
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : undefined;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const canManage = hasPermission(ctx.role, "customers:manage");

  const { items, total, pageSize } = await listCustomers({
    tenantId: ctx.tenantId,
    query,
    page,
  });

  const serialized: CustomerListItem[] = items.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    birthDate: toDateInput(c.birthDate),
    notes: c.notes,
    lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
    visits: c.visits,
    totalSpent: c.totalSpent,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Clientes"
        description="Base de clientes da barbearia."
      />
      <CustomersClient
        items={serialized}
        total={total}
        page={page}
        pageSize={pageSize}
        canManage={canManage}
      />
    </div>
  );
}

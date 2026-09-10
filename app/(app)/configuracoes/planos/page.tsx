import { requirePermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { getPlanUsage } from "@/lib/services/plan";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PlansClient } from "@/components/plans/plans-client";

export default async function PlansPage() {
  const ctx = await requirePermission("settings:view");
  const canManage = hasPermission(ctx.role, "billing:manage");
  const usage = await getPlanUsage(ctx.tenantId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Planos"
        description="Escolha o plano ideal para a sua barbearia."
      />

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <UsageRow
            label="Barbeiros ativos"
            value={usage.barbers}
            max={usage.maxBarbers}
          />
          <UsageRow
            label="Agendamentos no mês"
            value={usage.appointmentsThisMonth}
            max={usage.maxAppointmentsPerMonth}
          />
        </CardContent>
      </Card>

      <PlansClient currentPlan={usage.plan} canManage={canManage} />

      {!canManage && (
        <p className="text-sm text-muted-foreground">
          Apenas o proprietário pode alterar o plano.
        </p>
      )}
    </div>
  );
}

function UsageRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number | null;
}) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {max !== null ? ` / ${max}` : " / ∞"}
        </span>
      </div>
      {max !== null && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

import {
  Banknote,
  Percent,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { requireAnyPermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import {
  getFinanceSeries,
  getFinanceSummary,
  listCommissions,
  listExpenses,
} from "@/lib/services/finance";
import { resolvePeriod, type PeriodPreset } from "@/lib/finance/period";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodFilter } from "@/components/finance/period-filter";
import { FinanceChart } from "@/components/finance/finance-chart";
import {
  FinanceClient,
  type CommissionRow,
  type ExpenseRow,
} from "@/components/finance/finance-client";

const VALID_PRESETS: PeriodPreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "month",
  "prevMonth",
  "custom",
];

export default async function FinancePage({
  searchParams,
}: PageProps<"/financeiro">) {
  const ctx = await requireAnyPermission(["finance:view", "finance:view_own"]);
  const params = await searchParams;

  const canManage = hasPermission(ctx.role, "finance:manage");

  const preset: PeriodPreset =
    typeof params.period === "string" &&
    VALID_PRESETS.includes(params.period as PeriodPreset)
      ? (params.period as PeriodPreset)
      : "month";
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;

  const range = resolvePeriod(preset, from, to);

  const [summary, series, commissions, expenses] = await Promise.all([
    getFinanceSummary(ctx.tenantId, range),
    getFinanceSeries(ctx.tenantId, range),
    listCommissions(ctx.tenantId, range),
    listExpenses(ctx.tenantId, range),
  ]);

  const commissionRows: CommissionRow[] = commissions.map((c) => ({
    id: c.id,
    barberName: c.barber.name,
    serviceName: c.appointment.service.name,
    amount: Number(c.amount),
    percentage: Number(c.percentage),
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  const expenseRows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    description: e.description ?? "Despesa",
    amount: Number(e.amount),
    transactionDate: e.transactionDate.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas e comissões."
        action={<PeriodFilter preset={preset} from={from} to={to} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Receita bruta"
          value={formatCurrency(summary.grossRevenue)}
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Despesas"
          value={formatCurrency(summary.expenses)}
          icon={TrendingDown}
          accent="destructive"
        />
        <StatCard
          label="Receita líquida"
          value={formatCurrency(summary.netRevenue)}
          icon={PiggyBank}
          accent="primary"
        />
        <StatCard
          label="Comissões"
          value={formatCurrency(summary.commissions)}
          icon={Percent}
          accent="warning"
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(summary.averageTicket)}
          icon={Receipt}
          accent="primary"
        />
        <StatCard
          label="Total recebido"
          value={formatCurrency(summary.totalReceived)}
          icon={Banknote}
          accent="success"
        />
        <StatCard
          label="Total pendente"
          value={formatCurrency(summary.totalPending)}
          icon={Wallet}
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas x Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem movimentações no período.
            </p>
          ) : (
            <FinanceChart data={series} />
          )}
        </CardContent>
      </Card>

      {canManage && (
        <FinanceClient commissions={commissionRows} expenses={expenseRows} />
      )}
    </div>
  );
}

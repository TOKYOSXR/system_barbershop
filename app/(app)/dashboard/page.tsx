import {
  Ban,
  CalendarDays,
  DollarSign,
  Percent,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";

import { requirePermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { getDashboardData } from "@/lib/services/dashboard";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PeakHoursChart,
  RevenueChart,
  TopServicesChart,
} from "@/components/dashboard/dashboard-charts";

export default async function DashboardPage() {
  const ctx = await requirePermission("dashboard:view");

  // A barber without shop-wide finance access sees only their own numbers.
  const canSeeAll = hasPermission(ctx.role, "finance:view");
  const scopedBarberId = canSeeAll ? undefined : (ctx.barberId ?? "__none__");

  const data = await getDashboardData(ctx.tenantId, scopedBarberId);
  const { metrics } = data;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={`Olá, ${ctx.name?.split(" ")[0] ?? ""}`}
        description="Visão geral da barbearia."
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Faturamento hoje"
          value={formatCurrency(metrics.revenueToday)}
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          label="Faturamento do mês"
          value={formatCurrency(metrics.revenueMonth)}
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="Agendamentos hoje"
          value={String(metrics.appointmentsToday)}
          icon={CalendarDays}
          accent="primary"
        />
        <StatCard
          label="Clientes atendidos"
          value={String(metrics.customersServedToday)}
          icon={Users}
          hint="hoje"
          accent="primary"
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(metrics.averageTicket)}
          icon={Receipt}
          hint="no mês"
          accent="primary"
        />
        <StatCard
          label="Comissões"
          value={formatCurrency(metrics.commissionsMonth)}
          icon={Percent}
          hint="no mês"
          accent="warning"
        />
        <StatCard
          label="Cancelamentos"
          value={String(metrics.cancellationsMonth)}
          icon={Ban}
          hint="no mês"
          accent="destructive"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Faturamento (últimos 7 dias)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total 30 dias: {formatCurrency(data.revenueLast30Total)}
          </p>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.revenueLast7} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topServices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem dados no período.
              </p>
            ) : (
              <TopServicesChart data={data.topServices} />
            )}
          </CardContent>
        </Card>

        {/* Peak hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horários de maior movimento</CardTitle>
          </CardHeader>
          <CardContent>
            <PeakHoursChart data={data.peakHours} />
          </CardContent>
        </Card>
      </div>

      {/* Barbers performance (hidden for scoped barber view) */}
      {canSeeAll && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho dos barbeiros</CardTitle>
            <p className="text-sm text-muted-foreground">No mês atual</p>
          </CardHeader>
          <CardContent>
            {data.barbers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Sem dados de barbeiros"
                description="Os números aparecem conforme os atendimentos são concluídos."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barbeiro</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Ticket médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.barbers.map((b) => (
                    <TableRow key={b.name}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.appointments}</TableCell>
                      <TableCell>{formatCurrency(b.revenue)}</TableCell>
                      <TableCell>{formatCurrency(b.commission)}</TableCell>
                      <TableCell>{formatCurrency(b.averageTicket)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

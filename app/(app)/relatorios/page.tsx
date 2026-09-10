import { requirePermission } from "@/lib/permissions/guard";
import { resolvePeriod, type PeriodPreset } from "@/lib/finance/period";
import { getReport, type ReportKind } from "@/lib/services/reports";
import { PageHeader } from "@/components/dashboard/page-header";
import { PeriodFilter } from "@/components/finance/period-filter";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REPORT_KINDS: ReportKind[] = [
  "revenue",
  "services",
  "barbers",
  "customers",
  "cancellations",
  "peakHours",
];

const PRESETS: PeriodPreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "month",
  "prevMonth",
  "custom",
];

export default async function ReportsPage({
  searchParams,
}: PageProps<"/relatorios">) {
  const ctx = await requirePermission("reports:view");
  const params = await searchParams;

  const kind: ReportKind =
    typeof params.kind === "string" &&
    REPORT_KINDS.includes(params.kind as ReportKind)
      ? (params.kind as ReportKind)
      : "revenue";

  const preset: PeriodPreset =
    typeof params.period === "string" &&
    PRESETS.includes(params.period as PeriodPreset)
      ? (params.period as PeriodPreset)
      : "month";
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;

  const range = resolvePeriod(preset, from, to);
  const report = await getReport(kind, ctx.tenantId, range);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Relatórios"
        description="Análises do período e exportação para CSV."
        action={<PeriodFilter preset={preset} from={from} to={to} />}
      />

      <ReportsTabs active={kind} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{report.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {report.rows.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sem dados no período"
              description="Ajuste o período ou selecione outro relatório."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {report.columns.map((c) => (
                    <TableHead key={c.key}>{c.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row, i) => (
                  <TableRow key={i}>
                    {report.columns.map((c) => (
                      <TableCell key={c.key}>{row[c.key]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

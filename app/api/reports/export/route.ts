import type { NextRequest } from "next/server";

import { getSessionContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions/permissions";
import { resolvePeriod, type PeriodPreset } from "@/lib/finance/period";
import {
  getReport,
  REPORT_LABELS,
  type ReportKind,
} from "@/lib/services/reports";
import { buildCSV } from "@/lib/csv";

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

/** CSV export for reports. Authenticated + reports:view scoped. */
export async function GET(request: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return new Response("Unauthorized", { status: 401 });
  if (!hasPermission(ctx.role, "reports:view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const kind = params.get("kind") as ReportKind | null;
  if (!kind || !REPORT_KINDS.includes(kind)) {
    return new Response("Relatório inválido", { status: 400 });
  }

  const presetParam = params.get("period") as PeriodPreset | null;
  const preset: PeriodPreset =
    presetParam && PRESETS.includes(presetParam) ? presetParam : "month";
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const range = resolvePeriod(preset, from, to);
  const report = await getReport(kind, ctx.tenantId, range);
  const csv = buildCSV(report.columns, report.rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${REPORT_LABELS[kind].toLowerCase()}.csv"`,
    },
  });
}

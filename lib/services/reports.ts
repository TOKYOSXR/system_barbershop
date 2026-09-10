import { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/finance/period";

export type ReportKind =
  | "revenue"
  | "services"
  | "barbers"
  | "customers"
  | "cancellations"
  | "peakHours";

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportTable {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

/** Revenue per day (completed appointments). */
async function revenueReport(
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  const rows = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: AppointmentStatus.COMPLETED,
      startTime: { gte: range.from, lt: range.to },
    },
    select: { startTime: true, price: true },
  });

  const byDay = new Map<string, { count: number; total: number }>();
  for (const r of rows) {
    const key = dayKey(r.startTime);
    const e = byDay.get(key) ?? { count: 0, total: 0 };
    e.count += 1;
    e.total += Number(r.price);
    byDay.set(key, e);
  }

  return {
    title: "Faturamento por dia",
    columns: [
      { key: "date", label: "Data" },
      { key: "count", label: "Atendimentos" },
      { key: "total", label: "Faturamento (R$)" },
    ],
    rows: Array.from(byDay.entries())
      .sort()
      .map(([date, e]) => ({
        date: date.split("-").reverse().join("/"),
        count: e.count,
        total: e.total.toFixed(2),
      })),
  };
}

/** Services ranked by completed count and revenue. */
async function servicesReport(
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  const groups = await prisma.appointment.groupBy({
    by: ["serviceId"],
    where: {
      tenantId,
      status: AppointmentStatus.COMPLETED,
      startTime: { gte: range.from, lt: range.to },
    },
    _count: { _all: true },
    _sum: { price: true },
  });

  const services = await prisma.service.findMany({
    where: { id: { in: groups.map((g) => g.serviceId) } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(services.map((s) => [s.id, s.name]));

  return {
    title: "Serviços mais vendidos",
    columns: [
      { key: "service", label: "Serviço" },
      { key: "count", label: "Quantidade" },
      { key: "revenue", label: "Faturamento (R$)" },
    ],
    rows: groups
      .map((g) => ({
        service: nameMap.get(g.serviceId) ?? "—",
        count: g._count._all,
        revenue: Number(g._sum.price ?? 0),
      }))
      .sort((a, b) => b.count - a.count)
      .map((r) => ({ ...r, revenue: r.revenue.toFixed(2) })),
  };
}

/** Barber performance. */
async function barbersReport(
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  const [barbers, apptGroups, commissionGroups] = await Promise.all([
    prisma.barber.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),
    prisma.appointment.groupBy({
      by: ["barberId"],
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: range.from, lt: range.to },
      },
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.commission.groupBy({
      by: ["barberId"],
      where: { tenantId, createdAt: { gte: range.from, lt: range.to } },
      _sum: { amount: true },
    }),
  ]);

  const apptMap = new Map(
    apptGroups.map((g) => [
      g.barberId,
      { count: g._count._all, revenue: Number(g._sum.price ?? 0) },
    ]),
  );
  const commissionMap = new Map(
    commissionGroups.map((g) => [g.barberId, Number(g._sum.amount ?? 0)]),
  );

  return {
    title: "Desempenho dos barbeiros",
    columns: [
      { key: "barber", label: "Barbeiro" },
      { key: "count", label: "Atendimentos" },
      { key: "revenue", label: "Faturamento (R$)" },
      { key: "commission", label: "Comissão (R$)" },
    ],
    rows: barbers
      .map((b) => {
        const s = apptMap.get(b.id) ?? { count: 0, revenue: 0 };
        return {
          barber: b.name,
          count: s.count,
          revenue: s.revenue,
          commission: commissionMap.get(b.id) ?? 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({
        ...r,
        revenue: r.revenue.toFixed(2),
        commission: r.commission.toFixed(2),
      })),
  };
}

/** Top customers by spend / visits. */
async function customersReport(
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  const groups = await prisma.appointment.groupBy({
    by: ["customerId"],
    where: {
      tenantId,
      status: AppointmentStatus.COMPLETED,
      startTime: { gte: range.from, lt: range.to },
    },
    _count: { _all: true },
    _sum: { price: true },
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: groups.map((g) => g.customerId) } },
    select: { id: true, name: true, phone: true },
  });
  const map = new Map(customers.map((c) => [c.id, c]));

  return {
    title: "Clientes",
    columns: [
      { key: "customer", label: "Cliente" },
      { key: "phone", label: "Telefone" },
      { key: "visits", label: "Visitas" },
      { key: "spent", label: "Total gasto (R$)" },
    ],
    rows: groups
      .map((g) => ({
        customer: map.get(g.customerId)?.name ?? "—",
        phone: map.get(g.customerId)?.phone ?? "",
        visits: g._count._all,
        spent: Number(g._sum.price ?? 0),
      }))
      .sort((a, b) => b.spent - a.spent)
      .map((r) => ({ ...r, spent: r.spent.toFixed(2) })),
  };
}

/** Cancellations and no-shows in the period. */
async function cancellationsReport(
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  const rows = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: {
        in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
      startTime: { gte: range.from, lt: range.to },
    },
    orderBy: { startTime: "desc" },
    include: {
      customer: { select: { name: true } },
      barber: { select: { name: true } },
      service: { select: { name: true } },
    },
    take: 500,
  });

  return {
    title: "Cancelamentos e faltas",
    columns: [
      { key: "date", label: "Data" },
      { key: "customer", label: "Cliente" },
      { key: "barber", label: "Barbeiro" },
      { key: "service", label: "Serviço" },
      { key: "status", label: "Situação" },
    ],
    rows: rows.map((a) => ({
      date: a.startTime.toLocaleDateString("pt-BR"),
      customer: a.customer.name,
      barber: a.barber.name,
      service: a.service.name,
      status: a.status === "CANCELLED" ? "Cancelado" : "Não compareceu",
    })),
  };
}

/** Peak hours histogram. */
async function peakHoursReport(
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  const rows = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: {
        in: [
          AppointmentStatus.COMPLETED,
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CONFIRMED,
        ],
      },
      startTime: { gte: range.from, lt: range.to },
    },
    select: { startTime: true },
  });

  const counts = new Array(24).fill(0) as number[];
  for (const r of rows) counts[r.startTime.getHours()] += 1;

  return {
    title: "Horários de maior movimento",
    columns: [
      { key: "hour", label: "Hora" },
      { key: "count", label: "Agendamentos" },
    ],
    rows: counts
      .map((count, hour) => ({ hour: `${String(hour).padStart(2, "0")}h`, count }))
      .filter((h) => h.count > 0),
  };
}

const BUILDERS: Record<
  ReportKind,
  (tenantId: string, range: DateRange) => Promise<ReportTable>
> = {
  revenue: revenueReport,
  services: servicesReport,
  barbers: barbersReport,
  customers: customersReport,
  cancellations: cancellationsReport,
  peakHours: peakHoursReport,
};

export const REPORT_LABELS: Record<ReportKind, string> = {
  revenue: "Faturamento",
  services: "Serviços",
  barbers: "Barbeiros",
  customers: "Clientes",
  cancellations: "Cancelamentos",
  peakHours: "Horários de pico",
};

export function getReport(
  kind: ReportKind,
  tenantId: string,
  range: DateRange,
): Promise<ReportTable> {
  return BUILDERS[kind](tenantId, range);
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

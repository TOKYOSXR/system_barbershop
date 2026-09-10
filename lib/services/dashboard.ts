import { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { addDays, startOfDay, startOfMonth } from "@/lib/utils";

export interface DashboardMetrics {
  revenueToday: number;
  revenueMonth: number;
  appointmentsToday: number;
  customersServedToday: number;
  averageTicket: number;
  cancellationsMonth: number;
  commissionsMonth: number;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
}

export interface TopService {
  name: string;
  count: number;
}

export interface BarberPerformance {
  name: string;
  appointments: number;
  revenue: number;
  commission: number;
  averageTicket: number;
}

export interface PeakHour {
  hour: string;
  count: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  revenueLast7: RevenuePoint[];
  revenueLast30Total: number;
  topServices: TopService[];
  barbers: BarberPerformance[];
  peakHours: PeakHour[];
}

/**
 * Computes all dashboard figures for a tenant from real data. Optionally scoped
 * to a single barber (used by the BARBER role, who sees only their numbers).
 */
export async function getDashboardData(
  tenantId: string,
  barberId?: string,
): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const monthStart = startOfMonth(now);
  const last7Start = addDays(todayStart, -6);
  const last30Start = addDays(todayStart, -29);

  const barberFilter = barberId ? { barberId } : {};

  const [
    revenueTodayAgg,
    revenueMonthAgg,
    appointmentsToday,
    customersServedToday,
    completedMonth,
    cancellationsMonth,
    commissionsAgg,
    revenue30Rows,
    revenue30Agg,
    topServicesRows,
    peakRows,
  ] = await Promise.all([
    // Revenue today (completed appointments).
    prisma.appointment.aggregate({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: todayStart, lt: tomorrowStart },
      },
      _sum: { price: true },
    }),
    // Revenue this month.
    prisma.appointment.aggregate({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: monthStart },
      },
      _sum: { price: true },
    }),
    // Appointments scheduled for today (any active status).
    prisma.appointment.count({
      where: {
        tenantId,
        ...barberFilter,
        startTime: { gte: todayStart, lt: tomorrowStart },
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
    }),
    // Customers served today (completed).
    prisma.appointment.count({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    // Completed this month (for average ticket).
    prisma.appointment.aggregate({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: monthStart },
      },
      _count: { _all: true },
      _sum: { price: true },
    }),
    // Cancellations this month.
    prisma.appointment.count({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.CANCELLED,
        startTime: { gte: monthStart },
      },
    }),
    // Commissions this month.
    prisma.commission.aggregate({
      where: {
        tenantId,
        ...barberFilter,
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    // Revenue rows for the last 7 days (grouped in app code).
    prisma.appointment.findMany({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: last7Start, lt: tomorrowStart },
      },
      select: { startTime: true, price: true },
    }),
    // Total revenue last 30 days.
    prisma.appointment.aggregate({
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: last30Start, lt: tomorrowStart },
      },
      _sum: { price: true },
    }),
    // Top services (by completed count) this month.
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: {
        tenantId,
        ...barberFilter,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: monthStart },
      },
      _count: { _all: true },
    }),
    // Peak hours: completed appointments this month with start times.
    prisma.appointment.findMany({
      where: {
        tenantId,
        ...barberFilter,
        status: {
          in: [AppointmentStatus.COMPLETED, AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        startTime: { gte: last30Start },
      },
      select: { startTime: true },
    }),
  ]);

  const revenueMonth = Number(revenueMonthAgg._sum.price ?? 0);
  const completedCount = completedMonth._count._all;
  const completedSum = Number(completedMonth._sum.price ?? 0);

  const metrics: DashboardMetrics = {
    revenueToday: Number(revenueTodayAgg._sum.price ?? 0),
    revenueMonth,
    appointmentsToday,
    customersServedToday,
    averageTicket: completedCount > 0 ? completedSum / completedCount : 0,
    cancellationsMonth,
    commissionsMonth: Number(commissionsAgg._sum.amount ?? 0),
  };

  // Revenue per day for the last 7 days.
  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = addDays(last7Start, i);
    revenueByDay.set(dayKey(d), 0);
  }
  for (const row of revenue30Rows) {
    const key = dayKey(row.startTime);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(row.price));
    }
  }
  const revenueLast7: RevenuePoint[] = Array.from(revenueByDay.entries()).map(
    ([key, revenue]) => ({ label: key.slice(5).split("-").reverse().join("/"), revenue }),
  );

  // Top services: resolve names.
  const serviceIds = topServicesRows.map((r) => r.serviceId);
  const services = serviceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true },
      })
    : [];
  const serviceName = new Map(services.map((s) => [s.id, s.name]));
  const topServices: TopService[] = topServicesRows
    .map((r) => ({
      name: serviceName.get(r.serviceId) ?? "—",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Barber performance (only when not scoped to a single barber).
  const barbers = barberId
    ? []
    : await getBarberPerformance(tenantId, monthStart);

  // Peak hours histogram.
  const hourCounts = new Array(24).fill(0) as number[];
  for (const row of peakRows) {
    hourCounts[row.startTime.getHours()] += 1;
  }
  const peakHours: PeakHour[] = hourCounts
    .map((count, hour) => ({ hour: `${String(hour).padStart(2, "0")}h`, count }))
    .filter((h) => Number(h.hour.slice(0, 2)) >= 7 && Number(h.hour.slice(0, 2)) <= 21);

  return {
    metrics,
    revenueLast7,
    revenueLast30Total: Number(revenue30Agg._sum.price ?? 0),
    topServices,
    barbers,
    peakHours,
  };
}

async function getBarberPerformance(
  tenantId: string,
  monthStart: Date,
): Promise<BarberPerformance[]> {
  const [barbers, apptGroups, commissionGroups] = await Promise.all([
    prisma.barber.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true },
    }),
    prisma.appointment.groupBy({
      by: ["barberId"],
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        startTime: { gte: monthStart },
      },
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.commission.groupBy({
      by: ["barberId"],
      where: { tenantId, createdAt: { gte: monthStart } },
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

  return barbers
    .map((b) => {
      const stats = apptMap.get(b.id) ?? { count: 0, revenue: 0 };
      return {
        name: b.name,
        appointments: stats.count,
        revenue: stats.revenue,
        commission: commissionMap.get(b.id) ?? 0,
        averageTicket: stats.count > 0 ? stats.revenue / stats.count : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

import {
  AppointmentStatus,
  CommissionStatus,
  PaymentStatus,
  TransactionType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { DateRange } from "@/lib/finance/period";
import type { ExpenseInput } from "@/lib/validations/finance";

export interface FinanceSummary {
  grossRevenue: number;
  expenses: number;
  netRevenue: number;
  commissions: number;
  averageTicket: number;
  totalReceived: number;
  totalPending: number;
  completedCount: number;
}

export interface FinanceDayPoint {
  label: string;
  income: number;
  expense: number;
}

/** Aggregated financial figures for a tenant within a date range. */
export async function getFinanceSummary(
  tenantId: string,
  range: DateRange,
): Promise<FinanceSummary> {
  const { from, to } = range;

  const [income, expense, commissions, completed, received, pending] =
    await Promise.all([
      prisma.financialTransaction.aggregate({
        where: {
          tenantId,
          type: TransactionType.INCOME,
          transactionDate: { gte: from, lt: to },
        },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: {
          tenantId,
          type: TransactionType.EXPENSE,
          transactionDate: { gte: from, lt: to },
        },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { tenantId, createdAt: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
      prisma.appointment.aggregate({
        where: {
          tenantId,
          status: AppointmentStatus.COMPLETED,
          startTime: { gte: from, lt: to },
        },
        _count: { _all: true },
        _sum: { price: true },
      }),
      prisma.appointment.aggregate({
        where: {
          tenantId,
          paymentStatus: PaymentStatus.PAID,
          startTime: { gte: from, lt: to },
        },
        _sum: { price: true },
      }),
      prisma.appointment.aggregate({
        where: {
          tenantId,
          status: {
            in: [
              AppointmentStatus.SCHEDULED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.COMPLETED,
            ],
          },
          paymentStatus: PaymentStatus.PENDING,
          startTime: { gte: from, lt: to },
        },
        _sum: { price: true },
      }),
    ]);

  const grossRevenue = Number(income._sum.amount ?? 0);
  const expenses = Number(expense._sum.amount ?? 0);
  const completedCount = completed._count._all;
  const completedSum = Number(completed._sum.price ?? 0);

  return {
    grossRevenue,
    expenses,
    netRevenue: grossRevenue - expenses,
    commissions: Number(commissions._sum.amount ?? 0),
    averageTicket: completedCount > 0 ? completedSum / completedCount : 0,
    totalReceived: Number(received._sum.price ?? 0),
    totalPending: Number(pending._sum.price ?? 0),
    completedCount,
  };
}

/** Daily income/expense series for the chart. */
export async function getFinanceSeries(
  tenantId: string,
  range: DateRange,
): Promise<FinanceDayPoint[]> {
  const rows = await prisma.financialTransaction.findMany({
    where: {
      tenantId,
      transactionDate: { gte: range.from, lt: range.to },
    },
    select: { type: true, amount: true, transactionDate: true },
    orderBy: { transactionDate: "asc" },
  });

  const byDay = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const key = dayKey(row.transactionDate);
    const entry = byDay.get(key) ?? { income: 0, expense: 0 };
    if (row.type === TransactionType.INCOME) {
      entry.income += Number(row.amount);
    } else {
      entry.expense += Number(row.amount);
    }
    byDay.set(key, entry);
  }

  return Array.from(byDay.entries()).map(([key, v]) => ({
    label: key.slice(5).split("-").reverse().join("/"),
    income: v.income,
    expense: v.expense,
  }));
}

/** Commissions in a range, with barber name and appointment reference. */
export function listCommissions(tenantId: string, range: DateRange) {
  return prisma.commission.findMany({
    where: { tenantId, createdAt: { gte: range.from, lt: range.to } },
    orderBy: { createdAt: "desc" },
    include: {
      barber: { select: { name: true } },
      appointment: { select: { service: { select: { name: true } } } },
    },
    take: 200,
  });
}

/** Expense transactions in a range. */
export function listExpenses(tenantId: string, range: DateRange) {
  return prisma.financialTransaction.findMany({
    where: {
      tenantId,
      type: TransactionType.EXPENSE,
      transactionDate: { gte: range.from, lt: range.to },
    },
    orderBy: { transactionDate: "desc" },
    take: 200,
  });
}

export function markCommissionPaid(tenantId: string, id: string) {
  return prisma.commission.updateMany({
    where: { id, tenantId },
    data: { status: CommissionStatus.PAID },
  });
}

export function createExpense(tenantId: string, data: ExpenseInput) {
  return prisma.financialTransaction.create({
    data: {
      tenantId,
      type: TransactionType.EXPENSE,
      amount: data.amount,
      description: data.description,
      paymentMethod: data.paymentMethod ?? null,
      transactionDate: new Date(data.transactionDate),
    },
  });
}

export function deleteExpense(tenantId: string, id: string) {
  return prisma.financialTransaction.deleteMany({
    where: { id, tenantId, type: TransactionType.EXPENSE },
  });
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

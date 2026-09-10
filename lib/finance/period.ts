import { addDays, startOfDay, startOfMonth } from "@/lib/utils";

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "month"
  | "prevMonth"
  | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  last7: "Últimos 7 dias",
  last30: "Últimos 30 dias",
  month: "Este mês",
  prevMonth: "Mês anterior",
  custom: "Período personalizado",
};

export interface DateRange {
  from: Date;
  /** exclusive upper bound */
  to: Date;
}

/**
 * Resolves a period preset (or a custom from/to) into a concrete half-open
 * [from, to) range in local time.
 */
export function resolvePeriod(
  preset: PeriodPreset,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case "today":
      return { from: today, to: addDays(today, 1) };
    case "yesterday":
      return { from: addDays(today, -1), to: today };
    case "last7":
      return { from: addDays(today, -6), to: addDays(today, 1) };
    case "last30":
      return { from: addDays(today, -29), to: addDays(today, 1) };
    case "month":
      return {
        from: startOfMonth(now),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    case "prevMonth":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: startOfMonth(now),
      };
    case "custom": {
      const from = customFrom ? startOfDay(new Date(customFrom)) : today;
      const to = customTo
        ? addDays(startOfDay(new Date(customTo)), 1)
        : addDays(today, 1);
      return { from, to };
    }
  }
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import type { FinanceDayPoint } from "@/lib/services/finance";

const AXIS = "var(--color-muted-foreground)";
const GRID = "var(--color-border)";

export function FinanceChart({ data }: { data: FinanceDayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: AXIS, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v: number) => `R$${v}`}
        />
        <Tooltip
          formatter={(v) => formatCurrency(Number(v))}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
          cursor={{ fill: "transparent" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="income"
          name="Receita"
          fill="var(--color-success)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Despesa"
          fill="var(--color-destructive)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

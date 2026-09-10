"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import type {
  PeakHour,
  RevenuePoint,
  TopService,
} from "@/lib/services/dashboard";

const AXIS = "var(--color-muted-foreground)";
const PRIMARY = "var(--color-primary)";
const GRID = "var(--color-border)";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
          contentStyle={tooltipStyle}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Faturamento"
          stroke={PRIMARY}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TopServicesChart({ data }: { data: TopService[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: AXIS, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: AXIS, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
        <Bar
          dataKey="count"
          name="Vendas"
          fill={PRIMARY}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PeakHoursChart({ data }: { data: PeakHour[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fill: AXIS, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fill: AXIS, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={30}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "transparent" }} />
        <Bar
          dataKey="count"
          name="Agendamentos"
          fill={PRIMARY}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PERIOD_LABELS, type PeriodPreset } from "@/lib/finance/period";

const PRESETS: PeriodPreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "month",
  "prevMonth",
  "custom",
];

interface PeriodFilterProps {
  preset: PeriodPreset;
  from?: string;
  to?: string;
}

export function PeriodFilter({ preset, from, to }: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={preset}
        onChange={(e) => update({ period: e.target.value })}
        className="w-full sm:w-52"
      >
        {PRESETS.map((p) => (
          <option key={p} value={p}>
            {PERIOD_LABELS[p]}
          </option>
        ))}
      </Select>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from ?? ""}
            onChange={(e) => update({ from: e.target.value })}
            className="w-40"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            value={to ?? ""}
            onChange={(e) => update({ to: e.target.value })}
            className="w-40"
          />
        </div>
      )}
    </div>
  );
}

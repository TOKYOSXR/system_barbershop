"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REPORT_LABELS, type ReportKind } from "@/lib/services/reports";

const KINDS: ReportKind[] = [
  "revenue",
  "services",
  "barbers",
  "customers",
  "cancellations",
  "peakHours",
];

interface ReportsTabsProps {
  active: ReportKind;
}

export function ReportsTabs({ active }: ReportsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (kind: ReportKind) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("kind", kind);
    router.push(`${pathname}?${params.toString()}`);
  };

  const exportUrl = `/api/reports/export?${searchParams.toString()}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => select(k)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active === k
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {REPORT_LABELS[k]}
          </button>
        ))}
      </div>
      <div>
        <Button asChild variant="outline" size="sm">
          <a href={exportUrl} download>
            <Download />
            Exportar CSV
          </a>
        </Button>
      </div>
    </div>
  );
}

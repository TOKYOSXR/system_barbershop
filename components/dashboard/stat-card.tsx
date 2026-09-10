import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const ACCENTS: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-[--color-success]/15 text-[--color-success]",
  warning: "bg-[--color-warning]/15 text-[--color-warning]",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            ACCENTS[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold tracking-tight">{value}</p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

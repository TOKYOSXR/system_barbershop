"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WEEKDAY_LABELS } from "@/lib/constants";
import {
  getWorkingHoursAction,
  saveWorkingHoursAction,
  type WorkingHoursDay,
} from "@/lib/actions/schedule-actions";

interface WorkingHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
}

export function WorkingHoursDialog({
  open,
  onOpenChange,
  barberId,
  barberName,
}: WorkingHoursDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WorkingHoursBody
        key={barberId}
        barberId={barberId}
        barberName={barberName}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}

function WorkingHoursBody({
  barberId,
  barberName,
  onOpenChange,
}: {
  barberId: string;
  barberName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [days, setDays] = useState<WorkingHoursDay[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the current schedule when the dialog mounts (imperative fetch to
  // avoid setState-in-effect issues).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await Promise.resolve();
      if (cancelled) return;
      const result = await getWorkingHoursAction(barberId);
      if (cancelled) return;
      if (result.success) {
        setDays(result.data ?? []);
      } else {
        setError(result.error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [barberId]);

  const updateDay = (dow: number, patch: Partial<WorkingHoursDay>) => {
    setDays((prev) =>
      prev
        ? prev.map((d) => (d.dayOfWeek === dow ? { ...d, ...patch } : d))
        : prev,
    );
  };

  const save = async () => {
    if (!days) return;
    setError(null);

    // Basic client validation: active days need start < end.
    const invalid = days.find((d) => d.active && d.startTime >= d.endTime);
    if (invalid) {
      setError(
        `${WEEKDAY_LABELS[invalid.dayOfWeek]}: o início deve ser antes do fim.`,
      );
      return;
    }

    setSaving(true);
    const result = await saveWorkingHoursAction({ barberId, days });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Horários salvos.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Horários de {barberName}</DialogTitle>
        <DialogDescription>
          Defina os dias e horários de atendimento.
        </DialogDescription>
      </DialogHeader>

      {!days ? (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {days.map((d) => (
            <div
              key={d.dayOfWeek}
              className="flex items-center gap-3 rounded-md border p-2.5"
            >
              <div className="flex w-28 items-center gap-2">
                <Switch
                  checked={d.active}
                  onCheckedChange={(v) => updateDay(d.dayOfWeek, { active: v })}
                />
                <span className="text-sm font-medium">
                  {WEEKDAY_LABELS[d.dayOfWeek]}
                </span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={d.startTime}
                  disabled={!d.active}
                  onChange={(e) =>
                    updateDay(d.dayOfWeek, { startTime: e.target.value })
                  }
                  className="h-9"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={d.endTime}
                  disabled={!d.active}
                  onChange={(e) =>
                    updateDay(d.dayOfWeek, { endTime: e.target.value })
                  }
                  className="h-9"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={save} disabled={saving || !days}>
          {saving && <Loader2 className="animate-spin" />}
          Salvar horários
        </Button>
      </DialogFooter>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate, formatTime } from "@/lib/utils";
import { deleteBlockedTimeAction } from "@/lib/actions/schedule-actions";
import { BlockedTimeDialog } from "@/components/schedule/blocked-time-dialog";

export interface BlockRow {
  id: string;
  barberName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

interface Barber {
  id: string;
  name: string;
}

interface BlockedTimesClientProps {
  blocks: BlockRow[];
  barbers: Barber[];
}

export function BlockedTimesClient({
  blocks,
  barbers,
}: BlockedTimesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<BlockRow | null>(null);

  const remove = async () => {
    if (!toDelete) return;
    const result = await deleteBlockedTimeAction(toDelete.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Bloqueio removido.");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} disabled={barbers.length === 0}>
          <Plus />
          Novo bloqueio
        </Button>
      </div>

      {blocks.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="Nenhum bloqueio agendado"
          description="Cadastre folgas, férias ou intervalos para que não recebam agendamentos."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {blocks.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {formatDate(b.date)} · {formatTime(b.startTime)}–
                    {formatTime(b.endTime)}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.barberName}
                    {b.reason ? ` · ${b.reason}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setToDelete(b)}
                  aria-label="Remover bloqueio"
                >
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BlockedTimeDialog open={open} onOpenChange={setOpen} barbers={barbers} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Remover bloqueio?"
        description="O horário voltará a ficar disponível para agendamentos."
        confirmLabel="Remover"
        onConfirm={remove}
      />
    </div>
  );
}

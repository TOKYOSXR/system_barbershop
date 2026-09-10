"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toISODate } from "@/lib/utils";
import {
  blockedTimeSchema,
  type BlockedTimeFormInput,
} from "@/lib/validations/schedule";
import { createBlockedTimeAction } from "@/lib/actions/schedule-actions";

interface BarberOption {
  id: string;
  name: string;
}

interface BlockedTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbers: BarberOption[];
}

export function BlockedTimeDialog({
  open,
  onOpenChange,
  barbers,
}: BlockedTimeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BlockedTimeBody
        key={open ? "open" : "closed"}
        barbers={barbers}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}

function BlockedTimeBody({
  barbers,
  onOpenChange,
}: {
  barbers: BarberOption[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BlockedTimeFormInput>({
    resolver: zodResolver(blockedTimeSchema),
    defaultValues: {
      barberId: barbers[0]?.id ?? "",
      date: toISODate(new Date()),
      startTime: "12:00",
      endTime: "13:00",
      reason: "",
    },
  });

  const onSubmit = async (values: BlockedTimeFormInput) => {
    const result = await createBlockedTimeAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Bloqueio criado.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo bloqueio</DialogTitle>
        <DialogDescription>
          Reserve um período (almoço, folga, férias, reunião) em que o barbeiro
          não recebe agendamentos.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="barberId">Barbeiro</Label>
          <Select id="barberId" {...register("barberId")}>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          {errors.barberId && (
            <p className="text-sm text-destructive">
              {errors.barberId.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startTime">Início</Label>
            <Input id="startTime" type="time" {...register("startTime")} />
            {errors.startTime && (
              <p className="text-sm text-destructive">
                {errors.startTime.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endTime">Fim</Label>
            <Input id="endTime" type="time" {...register("endTime")} />
            {errors.endTime && (
              <p className="text-sm text-destructive">
                {errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Input
            id="reason"
            placeholder="Almoço, férias, reunião..."
            {...register("reason")}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Criar bloqueio
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bookingRulesSchema,
  type BookingRulesFormInput,
} from "@/lib/validations/settings";
import { updateBookingRulesAction } from "@/lib/actions/settings-actions";

interface BookingRulesFormProps {
  defaults: BookingRulesFormInput;
  canManage: boolean;
}

export function BookingRulesForm({
  defaults,
  canManage,
}: BookingRulesFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingRulesFormInput>({
    resolver: zodResolver(bookingRulesSchema),
    defaultValues: defaults,
  });

  const allowCancellation = watch("allowCancellation");

  const onSubmit = async (values: BookingRulesFormInput) => {
    const result = await updateBookingRulesAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Regras de agendamento atualizadas.");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Regras de agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="minLeadTimeMinutes"
              label="Antecedência mínima (min)"
              hint="Tempo mínimo entre agora e o horário agendado"
              error={errors.minLeadTimeMinutes?.message}
            >
              <Input
                id="minLeadTimeMinutes"
                type="number"
                disabled={!canManage}
                {...register("minLeadTimeMinutes")}
              />
            </Field>
            <Field
              id="maxFutureDays"
              label="Limite de agendamento futuro (dias)"
              error={errors.maxFutureDays?.message}
            >
              <Input
                id="maxFutureDays"
                type="number"
                disabled={!canManage}
                {...register("maxFutureDays")}
              />
            </Field>
            <Field
              id="slotIntervalMinutes"
              label="Intervalo entre horários (min)"
              hint="Passo dos horários disponíveis (ex: 15, 30)"
              error={errors.slotIntervalMinutes?.message}
            >
              <Input
                id="slotIntervalMinutes"
                type="number"
                disabled={!canManage}
                {...register("slotIntervalMinutes")}
              />
            </Field>
            <Field
              id="minCancelTimeMinutes"
              label="Tempo mínimo p/ cancelar (min)"
              error={errors.minCancelTimeMinutes?.message}
            >
              <Input
                id="minCancelTimeMinutes"
                type="number"
                disabled={!canManage || !allowCancellation}
                {...register("minCancelTimeMinutes")}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="allowCancellation">Permitir cancelamento</Label>
              <p className="text-sm text-muted-foreground">
                Clientes podem cancelar dentro do prazo definido
              </p>
            </div>
            <Switch
              id="allowCancellation"
              checked={allowCancellation ?? true}
              onCheckedChange={(v) => setValue("allowCancellation", v)}
              disabled={!canManage}
            />
          </div>

          {canManage && (
            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Salvar regras
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

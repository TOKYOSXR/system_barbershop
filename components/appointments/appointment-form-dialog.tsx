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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, toISODate } from "@/lib/utils";
import {
  createAppointmentAction,
  getSlotsAction,
  updateAppointmentAction,
} from "@/lib/actions/appointment-actions";

export interface Option {
  id: string;
  name: string;
}

export interface AppointmentEditValue {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  notes: string | null;
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Option[];
  barbers: Option[];
  services: Option[];
  appointment: AppointmentEditValue | null;
  defaultDate?: string;
}

/**
 * Outer shell: renders the modal and mounts a fresh form body each time it
 * opens (via `key`). Remounting resets the form state through lazy
 * initializers, avoiding setState-in-effect.
 */
export function AppointmentFormDialog({
  open,
  onOpenChange,
  customers,
  barbers,
  services,
  appointment,
  defaultDate,
}: AppointmentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppointmentFormBody
        key={appointment?.id ?? `new-${defaultDate ?? ""}`}
        onOpenChange={onOpenChange}
        customers={customers}
        barbers={barbers}
        services={services}
        appointment={appointment}
        defaultDate={defaultDate}
      />
    </Dialog>
  );
}

function AppointmentFormBody({
  onOpenChange,
  customers,
  barbers,
  services,
  appointment,
  defaultDate,
}: Omit<AppointmentFormDialogProps, "open">) {
  const router = useRouter();
  const isEdit = Boolean(appointment);

  const [customerId, setCustomerId] = useState(appointment?.customerId ?? "");
  const [serviceId, setServiceId] = useState(appointment?.serviceId ?? "");
  const [barberId, setBarberId] = useState(appointment?.barberId ?? "");
  const [date, setDate] = useState(
    appointment?.date ?? defaultDate ?? toISODate(new Date()),
  );
  const [startTime, setStartTime] = useState(appointment?.startTime ?? "");
  const [notes, setNotes] = useState(appointment?.notes ?? "");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available slots whenever service+barber+date are all chosen. This is
  // legitimate external synchronization (fetch), not a state reset.
  useEffect(() => {
    if (!serviceId || !barberId || !date) return;
    let cancelled = false;

    const load = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingSlots(true);
      const result = await getSlotsAction(barberId, serviceId, date);
      if (cancelled) return;
      const list = result.success ? [...(result.data ?? [])] : [];
      if (appointment?.startTime && !list.includes(appointment.startTime)) {
        list.unshift(appointment.startTime);
      }
      setSlots(list);
      setLoadingSlots(false);
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [serviceId, barberId, date, appointment?.startTime]);

  const submit = async () => {
    setError(null);
    if (!customerId || !serviceId || !barberId || !date || !startTime) {
      setError("Preencha todos os campos.");
      return;
    }
    setSubmitting(true);
    const payload = { customerId, barberId, serviceId, date, startTime, notes };
    const result = isEdit
      ? await updateAppointmentAction(appointment!.id, payload)
      : await createAppointmentAction(payload);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success(isEdit ? "Agendamento atualizado." : "Agendamento criado.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Editar agendamento" : "Novo agendamento"}
        </DialogTitle>
        <DialogDescription>
          Selecione serviço, barbeiro, data e um horário disponível.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Cliente</Label>
          <Select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Selecione o cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Serviço</Label>
            <Select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setStartTime("");
                setSlots([]);
              }}
            >
              <option value="">Selecione</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Barbeiro</Label>
            <Select
              value={barberId}
              onChange={(e) => {
                setBarberId(e.target.value);
                setStartTime("");
                setSlots([]);
              }}
            >
              <option value="">Selecione</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Data</Label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setStartTime("");
              setSlots([]);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Horário disponível</Label>
          {!serviceId || !barberId || !date ? (
            <p className="text-sm text-muted-foreground">
              Escolha serviço, barbeiro e data para ver os horários.
            </p>
          ) : loadingSlots ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando horários...
            </p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum horário disponível neste dia.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setStartTime(slot)}
                  className={cn(
                    "rounded-md border py-2 text-sm transition-colors",
                    startTime === slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          {isEdit ? "Salvar" : "Agendar"}
        </Button>
      </DialogFooter>
    </>
  );
}

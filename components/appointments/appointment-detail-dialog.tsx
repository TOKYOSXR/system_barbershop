"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentStatus, PaymentMethod } from "@prisma/client";

import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  APPOINTMENT_STATUS_FLOW,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_VARIANT,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { changeStatusAction } from "@/lib/actions/appointment-actions";
import { buildWhatsappLink } from "@/lib/notifications/whatsapp";
import { buildMessage } from "@/lib/notifications/templates";

export interface AppointmentDetail {
  id: string;
  customerName: string;
  customerPhone: string;
  barberName: string;
  serviceName: string;
  startTime: string; // ISO
  endTime: string; // ISO
  price: number;
  status: AppointmentStatus;
  notes: string | null;
}

interface AppointmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentDetail | null;
  canManage: boolean;
  barbershopName: string;
  onEdit?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "OTHER",
];

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  appointment,
  canManage,
  barbershopName,
  onEdit,
}: AppointmentDetailDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<AppointmentStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  if (!appointment) return null;

  const nextStatuses = APPOINTMENT_STATUS_FLOW[appointment.status];

  const messageCtx = {
    customerName: appointment.customerName,
    barbershopName,
    serviceName: appointment.serviceName,
    barberName: appointment.barberName,
    dateLabel: formatDate(appointment.startTime),
    timeLabel: formatTime(appointment.startTime),
  };

  const handleChange = async (status: AppointmentStatus) => {
    setLoading(status);
    const result = await changeStatusAction(appointment.id, {
      status,
      ...(status === "COMPLETED" ? { paymentMethod } : {}),
    });
    setLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Status atualizado.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {appointment.serviceName}
          <Badge variant={APPOINTMENT_STATUS_VARIANT[appointment.status]}>
            {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {formatDate(appointment.startTime)} ·{" "}
          {formatTime(appointment.startTime)}–{formatTime(appointment.endTime)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 text-sm">
        <Row label="Cliente" value={appointment.customerName} />
        <Row label="Barbeiro" value={appointment.barberName} />
        <Row label="Valor" value={formatCurrency(appointment.price)} />
        {appointment.notes && <Row label="Obs." value={appointment.notes} />}
      </div>

      {canManage && nextStatuses.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t pt-4">
          {nextStatuses.includes("COMPLETED") && (
            <div className="flex flex-col gap-1.5">
              <Label>Forma de pagamento (ao concluir)</Label>
              <Select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={
                  status === "CANCELLED" || status === "NO_SHOW"
                    ? "outline"
                    : "default"
                }
                size="sm"
                disabled={loading !== null}
                onClick={() => handleChange(status)}
              >
                {loading === status && <Loader2 className="animate-spin" />}
                {APPOINTMENT_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {canManage && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Button asChild variant="outline" size="sm">
            <a
              href={buildWhatsappLink(
                appointment.customerPhone,
                buildMessage("APPOINTMENT_CONFIRMED", messageCtx),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Enviar confirmação
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href={buildWhatsappLink(
                appointment.customerPhone,
                buildMessage("APPOINTMENT_REMINDER", messageCtx),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Lembrar cliente
            </a>
          </Button>
        </div>
      )}

      <DialogFooter>
        {canManage && onEdit && (
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            <Pencil />
            Editar
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

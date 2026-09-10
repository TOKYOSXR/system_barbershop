import type { NotificationType } from "@prisma/client";

export interface MessageContext {
  customerName: string;
  barbershopName: string;
  serviceName: string;
  barberName: string;
  dateLabel: string; // dd/MM/yyyy
  timeLabel: string; // HH:mm
}

/**
 * Builds the message body for a notification type (section 15/16).
 * Kept pure so it can be reused for WhatsApp, email and push, and unit tested.
 */
export function buildMessage(
  type: NotificationType,
  ctx: MessageContext,
): string {
  const firstName = ctx.customerName.split(" ")[0];

  switch (type) {
    case "APPOINTMENT_CREATED":
      return `Olá, ${firstName}! Seu horário na ${ctx.barbershopName} foi agendado: ${ctx.serviceName} com ${ctx.barberName} em ${ctx.dateLabel} às ${ctx.timeLabel}.`;
    case "APPOINTMENT_CONFIRMED":
      return `Olá, ${firstName}! Seu horário na ${ctx.barbershopName} está confirmado para ${ctx.dateLabel} às ${ctx.timeLabel}. Até logo!`;
    case "APPOINTMENT_CANCELLED":
      return `Olá, ${firstName}. Seu horário na ${ctx.barbershopName} em ${ctx.dateLabel} às ${ctx.timeLabel} foi cancelado. Se precisar, reagende com a gente.`;
    case "APPOINTMENT_REMINDER":
      return `Olá, ${firstName}! Lembrando do seu horário na ${ctx.barbershopName} em ${ctx.dateLabel} às ${ctx.timeLabel}. Te esperamos!`;
    case "APPOINTMENT_COMPLETED":
      return `Obrigado pela visita, ${firstName}! Esperamos ver você de novo na ${ctx.barbershopName}.`;
  }
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: "Novo agendamento",
  APPOINTMENT_CONFIRMED: "Confirmação",
  APPOINTMENT_CANCELLED: "Cancelamento",
  APPOINTMENT_REMINDER: "Lembrete",
  APPOINTMENT_COMPLETED: "Atendimento concluído",
};

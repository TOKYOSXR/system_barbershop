import {
  AppointmentStatus,
  CommissionStatus,
  PaymentMethod,
  PaymentStatus,
  PlanType,
  UserRole,
} from "@prisma/client";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  OTHER: "Outro",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  BARBER: "Barbeiro",
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

/** SaaS plan definitions. Billing is architecturally prepared, not yet charged. */
export const PLAN_LIMITS: Record<
  PlanType,
  { maxBarbers: number | null; maxAppointmentsPerMonth: number | null; label: string; price: number }
> = {
  FREE: { maxBarbers: 1, maxAppointmentsPerMonth: 50, label: "Free", price: 0 },
  PRO: { maxBarbers: 5, maxAppointmentsPerMonth: null, label: "Pro", price: 49.9 },
  BUSINESS: {
    maxBarbers: null,
    maxAppointmentsPerMonth: null,
    label: "Business",
    price: 99.9,
  },
};

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline"
  | "muted";

export const APPOINTMENT_STATUS_VARIANT: Record<
  AppointmentStatus,
  BadgeVariant
> = {
  SCHEDULED: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "muted",
};

/** Valid manual status transitions offered in the UI. */
export const APPOINTMENT_STATUS_FLOW: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  SCHEDULED: ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["SCHEDULED"],
  CANCELLED: ["SCHEDULED"],
  NO_SHOW: ["SCHEDULED"],
};

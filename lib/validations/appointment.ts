import { z } from "zod";
import {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido");

/** Create/edit an appointment from the internal panel. */
export const appointmentSchema = z.object({
  customerId: z.string().min(1, "Selecione o cliente"),
  barberId: z.string().min(1, "Selecione o barbeiro"),
  serviceId: z.string().min(1, "Selecione o serviço"),
  date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida"),
  startTime: hhmm,
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

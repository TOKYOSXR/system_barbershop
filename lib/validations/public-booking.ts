import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido");

/** Public booking payload (no authentication). Tenant comes from the slug. */
export const publicBookingSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1, "Selecione o serviço"),
  barberId: z.string().min(1, "Selecione o barbeiro"),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida"),
  startTime: hhmm,
  customerName: z.string().min(2, "Informe seu nome").max(80),
  customerPhone: z
    .string()
    .min(8, "Telefone inválido")
    .max(20)
    .regex(/^[0-9()+\-\s]+$/, "Telefone inválido"),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

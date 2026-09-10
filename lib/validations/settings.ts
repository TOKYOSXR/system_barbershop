import { z } from "zod";

const optional = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

/** Barbershop general information (section 24). */
export const tenantInfoSchema = z.object({
  name: z.string().min(2, "Informe o nome da barbearia").max(80),
  phone: optional(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: optional(160),
  city: optional(80),
  state: optional(40),
  zipCode: optional(12),
});

export type TenantInfoInput = z.infer<typeof tenantInfoSchema>;

/** Booking rules (section 24). */
export const bookingRulesSchema = z.object({
  minLeadTimeMinutes: z.coerce
    .number()
    .int()
    .min(0, "Valor inválido")
    .max(10080, "Máximo de 1 semana"),
  maxFutureDays: z.coerce
    .number()
    .int()
    .min(1, "Mínimo de 1 dia")
    .max(365, "Máximo de 365 dias"),
  allowCancellation: z.boolean(),
  minCancelTimeMinutes: z.coerce
    .number()
    .int()
    .min(0, "Valor inválido")
    .max(10080, "Máximo de 1 semana"),
  slotIntervalMinutes: z.coerce
    .number()
    .int()
    .min(5, "Mínimo de 5 minutos")
    .max(120, "Máximo de 120 minutos"),
});

export type BookingRulesInput = z.infer<typeof bookingRulesSchema>;
export type BookingRulesFormInput = z.input<typeof bookingRulesSchema>;

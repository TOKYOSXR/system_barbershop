import { z } from "zod";

export const barberSchema = z.object({
  name: z.string().min(2, "Informe o nome do barbeiro").max(80),
  phone: z
    .string()
    .max(20)
    .regex(/^[0-9()+\-\s]*$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  specialties: z.array(z.string().max(40)).max(20).default([]),
  commissionPercentage: z.coerce
    .number()
    .min(0, "Comissão inválida")
    .max(100, "Comissão inválida"),
  active: z.boolean().default(true),
});

export type BarberInput = z.infer<typeof barberSchema>;
export type BarberFormInput = z.input<typeof barberSchema>;

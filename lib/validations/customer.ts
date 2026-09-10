import { z } from "zod";

const optionalString = z.string().max(500).optional().or(z.literal(""));

export const customerSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente").max(80),
  phone: z
    .string()
    .min(8, "Telefone inválido")
    .max(20, "Telefone inválido")
    .regex(/^[0-9()+\-\s]+$/, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birthDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "Data de nascimento inválida",
    ),
  notes: optionalString,
});

export type CustomerInput = z.infer<typeof customerSchema>;

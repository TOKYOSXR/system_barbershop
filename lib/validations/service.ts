import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2, "Informe o nome do serviço").max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  durationMinutes: z.coerce
    .number()
    .int("Duração inválida")
    .min(5, "Mínimo de 5 minutos")
    .max(600, "Máximo de 600 minutos"),
  price: z.coerce
    .number()
    .min(0, "Preço inválido")
    .max(100000, "Preço muito alto"),
  active: z.boolean().default(true),
});

// Output = after coercion (used by the service layer). Input = raw form values.
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceFormInput = z.input<typeof serviceSchema>;

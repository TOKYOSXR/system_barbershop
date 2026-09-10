import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("Informe um valor válido").max(1_000_000),
  description: z.string().min(2, "Informe uma descrição").max(200),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  transactionDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseFormInput = z.input<typeof expenseSchema>;

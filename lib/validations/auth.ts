import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    barbershopName: z
      .string()
      .min(2, "Informe o nome da barbearia")
      .max(80, "Nome muito longo"),
    name: z.string().min(2, "Informe seu nome").max(80, "Nome muito longo"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres")
      .max(72, "Senha muito longa"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

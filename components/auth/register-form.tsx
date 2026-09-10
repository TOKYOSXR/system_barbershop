"use client";

import { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerBarbershop } from "@/lib/auth/actions";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      barbershopName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setFormError(null);
    const result = await registerBarbershop(values);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    // Auto sign-in after successful registration.
    const { email, password } = getValues();
    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field
        id="barbershopName"
        label="Nome da barbearia"
        placeholder="Barbearia do João"
        error={errors.barbershopName?.message}
        {...register("barbershopName")}
      />
      <Field
        id="name"
        label="Seu nome"
        placeholder="João Silva"
        error={errors.name?.message}
        {...register("name")}
      />
      <Field
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="voce@barbearia.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Field
        id="password"
        type="password"
        label="Senha"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register("password")}
      />
      <Field
        id="confirmPassword"
        type="password"
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Repita a senha"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Criar conta
      </Button>
    </form>
  );
}

interface FieldProps extends React.ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ id, label, error, ...inputProps }, ref) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} ref={ref} {...inputProps} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  ),
);
Field.displayName = "Field";

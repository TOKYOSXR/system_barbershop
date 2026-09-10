"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  tenantInfoSchema,
  type TenantInfoInput,
} from "@/lib/validations/settings";
import { updateTenantInfoAction } from "@/lib/actions/settings-actions";

interface TenantInfoFormProps {
  defaults: TenantInfoInput;
  publicUrl: string;
  canManage: boolean;
}

export function TenantInfoForm({
  defaults,
  publicUrl,
  canManage,
}: TenantInfoFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantInfoInput>({
    resolver: zodResolver(tenantInfoSchema),
    defaultValues: defaults,
  });

  const onSubmit = async (values: TenantInfoInput) => {
    const result = await updateTenantInfoAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Informações atualizadas.");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informações</CardTitle>
        <p className="text-sm text-muted-foreground">
          Página pública de agendamento:{" "}
          <span className="font-medium text-foreground">{publicUrl}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Field id="name" label="Nome da barbearia" error={errors.name?.message}>
            <Input id="name" disabled={!canManage} {...register("name")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="phone" label="Telefone" error={errors.phone?.message}>
              <Input id="phone" disabled={!canManage} {...register("phone")} />
            </Field>
            <Field id="email" label="Email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                disabled={!canManage}
                {...register("email")}
              />
            </Field>
          </div>

          <Field id="address" label="Endereço" error={errors.address?.message}>
            <Input id="address" disabled={!canManage} {...register("address")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="city" label="Cidade" error={errors.city?.message}>
              <Input id="city" disabled={!canManage} {...register("city")} />
            </Field>
            <Field id="state" label="Estado" error={errors.state?.message}>
              <Input id="state" disabled={!canManage} {...register("state")} />
            </Field>
            <Field id="zipCode" label="CEP" error={errors.zipCode?.message}>
              <Input id="zipCode" disabled={!canManage} {...register("zipCode")} />
            </Field>
          </div>

          {canManage && (
            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Salvar informações
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

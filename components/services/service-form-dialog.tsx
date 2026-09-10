"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  serviceSchema,
  type ServiceFormInput,
} from "@/lib/validations/service";
import {
  createServiceAction,
  updateServiceAction,
} from "@/lib/actions/service-actions";

export interface ServiceFormValue {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceFormValue | null;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: ServiceFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 30,
      price: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? "",
        description: service?.description ?? "",
        durationMinutes: service?.durationMinutes ?? 30,
        price: service?.price ?? 0,
        active: service?.active ?? true,
      });
    }
  }, [open, service, reset]);

  const active = watch("active");

  const onSubmit = async (values: ServiceFormInput) => {
    const result = isEdit
      ? await updateServiceAction(service!.id, values)
      : await createServiceAction(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Serviço atualizado." : "Serviço criado.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        <DialogDescription>
          Defina nome, duração e preço do serviço.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Corte" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea id="description" {...register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="durationMinutes">Duração (min)</Label>
            <Input
              id="durationMinutes"
              type="number"
              {...register("durationMinutes")}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-destructive">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price")}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="active">Serviço ativo</Label>
          <Switch
            id="active"
            checked={active ?? true}
            onCheckedChange={(v) => setValue("active", v)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

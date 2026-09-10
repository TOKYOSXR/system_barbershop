"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  barberSchema,
  type BarberFormInput,
} from "@/lib/validations/barber";
import {
  createBarberAction,
  updateBarberAction,
} from "@/lib/actions/barber-actions";

export interface BarberFormValue {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  specialties: string[];
  commissionPercentage: number;
  active: boolean;
}

interface BarberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: BarberFormValue | null;
}

export function BarberFormDialog({
  open,
  onOpenChange,
  barber,
}: BarberFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(barber);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BarberFormInput>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      bio: "",
      specialties: [],
      commissionPercentage: 40,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      const initialSpecialties = barber?.specialties ?? [];
      setSpecialties(initialSpecialties);
      setSpecialtyInput("");
      reset({
        name: barber?.name ?? "",
        phone: barber?.phone ?? "",
        email: barber?.email ?? "",
        bio: barber?.bio ?? "",
        specialties: initialSpecialties,
        commissionPercentage: barber?.commissionPercentage ?? 40,
        active: barber?.active ?? true,
      });
    }
  }, [open, barber, reset]);

  const active = watch("active");

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (!value || specialties.includes(value)) {
      setSpecialtyInput("");
      return;
    }
    const next = [...specialties, value];
    setSpecialties(next);
    setValue("specialties", next);
    setSpecialtyInput("");
  };

  const removeSpecialty = (value: string) => {
    const next = specialties.filter((s) => s !== value);
    setSpecialties(next);
    setValue("specialties", next);
  };

  const onSubmit = async (values: BarberFormInput) => {
    const payload = { ...values, specialties };
    const result = isEdit
      ? await updateBarberAction(barber!.id, payload)
      : await createBarberAction(payload);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Barbeiro atualizado." : "Barbeiro cadastrado.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Editar barbeiro" : "Novo barbeiro"}
        </DialogTitle>
        <DialogDescription>
          Dados, especialidades e comissão do barbeiro.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="João Silva" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="commissionPercentage">Comissão (%)</Label>
            <Input
              id="commissionPercentage"
              type="number"
              step="0.5"
              {...register("commissionPercentage")}
            />
            {errors.commissionPercentage && (
              <p className="text-sm text-destructive">
                {errors.commissionPercentage.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Especialidades</Label>
          <div className="flex gap-2">
            <Input
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialty();
                }
              }}
              placeholder="Ex: Barba, Platinado"
            />
            <Button type="button" variant="outline" onClick={addSpecialty}>
              Adicionar
            </Button>
          </div>
          {specialties.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {specialties.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(s)}
                    aria-label={`Remover ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">Bio (opcional)</Label>
          <Textarea id="bio" {...register("bio")} />
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="active">Barbeiro ativo</Label>
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
            {isEdit ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

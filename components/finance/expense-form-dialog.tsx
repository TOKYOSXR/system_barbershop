"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PaymentMethod } from "@prisma/client";

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
import { Select } from "@/components/ui/select";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { toISODate } from "@/lib/utils";
import { expenseSchema, type ExpenseFormInput } from "@/lib/validations/finance";
import { createExpenseAction } from "@/lib/actions/finance-actions";

const METHODS: PaymentMethod[] = [
  "CASH",
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "OTHER",
];

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
}: ExpenseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ExpenseFormBody onOpenChange={onOpenChange} />
    </Dialog>
  );
}

function ExpenseFormBody({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      paymentMethod: "CASH",
      transactionDate: toISODate(new Date()),
    },
  });

  const onSubmit = async (values: ExpenseFormInput) => {
    const result = await createExpenseAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Despesa registrada.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova despesa</DialogTitle>
        <DialogDescription>
          Registre uma saída financeira (aluguel, produtos, etc).
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            placeholder="Aluguel, produtos..."
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transactionDate">Data</Label>
            <Input
              id="transactionDate"
              type="date"
              {...register("transactionDate")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paymentMethod">Forma de pagamento</Label>
          <Select id="paymentMethod" {...register("paymentMethod")}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
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
            Registrar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

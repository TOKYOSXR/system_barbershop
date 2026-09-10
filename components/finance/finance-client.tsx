"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import { COMMISSION_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  deleteExpenseAction,
  markCommissionPaidAction,
} from "@/lib/actions/finance-actions";

export interface CommissionRow {
  id: string;
  barberName: string;
  serviceName: string;
  amount: number;
  percentage: number;
  status: "PENDING" | "PAID";
  createdAt: string;
}

export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  transactionDate: string;
}

interface FinanceClientProps {
  commissions: CommissionRow[];
  expenses: ExpenseRow[];
}

export function FinanceClient({ commissions, expenses }: FinanceClientProps) {
  const router = useRouter();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ExpenseRow | null>(null);

  const payCommission = async (id: string) => {
    setPayingId(id);
    const result = await markCommissionPaidAction(id);
    setPayingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Comissão marcada como paga.");
    router.refresh();
  };

  const removeExpense = async () => {
    if (!toDelete) return;
    const result = await deleteExpenseAction(toDelete.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Despesa removida.");
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma comissão no período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.barberName}
                    </TableCell>
                    <TableCell>{c.serviceName}</TableCell>
                    <TableCell>{formatCurrency(c.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "PAID" ? "success" : "warning"}
                      >
                        {COMMISSION_STATUS_LABELS[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={payingId === c.id}
                          onClick={() => payCommission(c.id)}
                        >
                          <Check />
                          Pagar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Despesas</CardTitle>
          <Button size="sm" onClick={() => setExpenseOpen(true)}>
            <Plus />
            Nova
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma despesa no período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      {e.description}
                    </TableCell>
                    <TableCell>{formatDate(e.transactionDate)}</TableCell>
                    <TableCell>{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToDelete(e)}
                        aria-label="Remover"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Remover despesa?"
        description={`"${toDelete?.description}" será removida permanentemente.`}
        confirmLabel="Remover"
        onConfirm={removeExpense}
      />
    </div>
  );
}

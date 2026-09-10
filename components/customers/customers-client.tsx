"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Power, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deactivateCustomerAction } from "@/lib/actions/customer-actions";
import {
  CustomerFormDialog,
  type CustomerFormValue,
} from "@/components/customers/customer-form-dialog";

export interface CustomerListItem extends CustomerFormValue {
  lastVisitAt: string | null;
  visits: number;
  totalSpent: number;
}

interface CustomersClientProps {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  canManage: boolean;
}

export function CustomersClient({
  items,
  total,
  page,
  pageSize,
  canManage,
}: CustomersClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerFormValue | null>(null);
  const [toDeactivate, setToDeactivate] = useState<CustomerListItem | null>(
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: CustomerFormValue) => {
    setEditing(c);
    setFormOpen(true);
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    const result = await deactivateCustomerAction(toDeactivate.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Cliente desativado.");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Buscar por nome ou telefone..." />
        {canManage && (
          <Button onClick={openCreate}>
            <Plus />
            Novo cliente
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Cadastre seus clientes para acompanhar o histórico."
          action={
            canManage ? (
              <Button onClick={openCreate} variant="outline">
                <Plus />
                Novo cliente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Último atendimento</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Total gasto</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="flex items-center gap-3 font-medium hover:underline"
                      >
                        <Avatar name={c.name} />
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>
                      {c.lastVisitAt ? formatDate(c.lastVisitAt) : "—"}
                    </TableCell>
                    <TableCell>{c.visits}</TableCell>
                    <TableCell>{formatCurrency(c.totalSpent)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(c)}
                            aria-label="Editar"
                          >
                            <Pencil />
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setToDeactivate(c)}
                            aria-label="Desativar"
                          >
                            <Power />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-3 rounded-xl border p-4"
              >
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{formatCurrency(c.totalSpent)}</p>
                  <p className="text-muted-foreground">{c.visits} visitas</p>
                </div>
              </Link>
            ))}
          </div>

          <Pagination page={page} pageSize={pageSize} total={total} />
        </>
      )}

      {canManage && (
        <>
          <CustomerFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            customer={editing}
          />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(v) => !v && setToDeactivate(null)}
            title="Desativar cliente?"
            description={`"${toDeactivate?.name}" será ocultado da lista. O histórico é preservado.`}
            confirmLabel="Desativar"
            onConfirm={handleDeactivate}
          />
        </>
      )}
    </div>
  );
}

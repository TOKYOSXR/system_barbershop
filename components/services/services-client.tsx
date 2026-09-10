"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Scissors } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils";
import { deactivateServiceAction } from "@/lib/actions/service-actions";
import {
  ServiceFormDialog,
  type ServiceFormValue,
} from "@/components/services/service-form-dialog";

interface ServicesClientProps {
  items: ServiceFormValue[];
  total: number;
  page: number;
  pageSize: number;
  canManage: boolean;
}

export function ServicesClient({
  items,
  total,
  page,
  pageSize,
  canManage,
}: ServicesClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceFormValue | null>(null);
  const [toDeactivate, setToDeactivate] = useState<ServiceFormValue | null>(
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (service: ServiceFormValue) => {
    setEditing(service);
    setFormOpen(true);
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    const result = await deactivateServiceAction(toDeactivate.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Serviço desativado.");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Buscar serviço..." />
        {canManage && (
          <Button onClick={openCreate}>
            <Plus />
            Novo serviço
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço encontrado"
          description="Cadastre os serviços oferecidos pela sua barbearia."
          action={
            canManage ? (
              <Button onClick={openCreate} variant="outline">
                <Plus />
                Novo serviço
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>{service.durationMinutes} min</TableCell>
                    <TableCell>{formatCurrency(service.price)}</TableCell>
                    <TableCell>
                      {service.active ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="muted">Inativo</Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(service)}
                            aria-label="Editar"
                          >
                            <Pencil />
                          </Button>
                          {service.active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setToDeactivate(service)}
                              aria-label="Desativar"
                            >
                              <Power />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} />
        </>
      )}

      {canManage && (
        <>
          <ServiceFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            service={editing}
          />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(v) => !v && setToDeactivate(null)}
            title="Desativar serviço?"
            description={`"${toDeactivate?.name}" deixará de aparecer para novos agendamentos. O histórico é preservado.`}
            confirmLabel="Desativar"
            onConfirm={handleDeactivate}
          />
        </>
      )}
    </div>
  );
}

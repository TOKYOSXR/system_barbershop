"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Pencil, Plus, Power, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deactivateBarberAction } from "@/lib/actions/barber-actions";
import {
  BarberFormDialog,
  type BarberFormValue,
} from "@/components/barbers/barber-form-dialog";
import { WorkingHoursDialog } from "@/components/barbers/working-hours-dialog";

interface BarbersClientProps {
  items: BarberFormValue[];
  canManage: boolean;
}

export function BarbersClient({ items, canManage }: BarbersClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BarberFormValue | null>(null);
  const [toDeactivate, setToDeactivate] = useState<BarberFormValue | null>(
    null,
  );
  const [hoursFor, setHoursFor] = useState<BarberFormValue | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (b: BarberFormValue) => {
    setEditing(b);
    setFormOpen(true);
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    const result = await deactivateBarberAction(toDeactivate.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Barbeiro desativado.");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus />
            Novo barbeiro
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nenhum barbeiro cadastrado"
          description="Adicione os profissionais da sua equipe."
          action={
            canManage ? (
              <Button onClick={openCreate} variant="outline">
                <Plus />
                Novo barbeiro
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.name} className="h-11 w-11" />
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Comissão {b.commissionPercentage}%
                      </p>
                    </div>
                  </div>
                  {b.active ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="muted">Inativo</Badge>
                  )}
                </div>

                {b.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {b.specialties.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                {canManage && (
                  <div className="mt-1 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(b)}
                    >
                      <Pencil />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHoursFor(b)}
                    >
                      <Clock />
                      Horários
                    </Button>
                    {b.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDeactivate(b)}
                      >
                        <Power />
                        Desativar
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canManage && (
        <>
          <BarberFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            barber={editing}
          />
          <ConfirmDialog
            open={Boolean(toDeactivate)}
            onOpenChange={(v) => !v && setToDeactivate(null)}
            title="Desativar barbeiro?"
            description={`"${toDeactivate?.name}" deixará de aparecer para novos agendamentos. O histórico é preservado.`}
            confirmLabel="Desativar"
            onConfirm={handleDeactivate}
          />
          {hoursFor && (
            <WorkingHoursDialog
              open={Boolean(hoursFor)}
              onOpenChange={(v) => !v && setHoursFor(null)}
              barberId={hoursFor.id}
              barberName={hoursFor.name}
            />
          )}
        </>
      )}
    </div>
  );
}

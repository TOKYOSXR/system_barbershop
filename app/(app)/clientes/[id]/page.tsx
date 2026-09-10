import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { requirePermission } from "@/lib/permissions/guard";
import { getCustomerProfile } from "@/lib/services/customer";
import {
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomerProfilePage({
  params,
}: PageProps<"/clientes/[id]">) {
  const ctx = await requirePermission("customers:view");
  const { id } = await params;

  const profile = await getCustomerProfile(ctx.tenantId, id);
  if (!profile) notFound();

  const { customer, appointments, stats } = profile;
  const phoneDigits = customer.phone.replace(/\D/g, "");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <Link
        href="/clientes"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={customer.name} className="h-14 w-14 text-lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {customer.phone}
              {customer.email ? ` · ${customer.email}` : ""}
            </p>
          </div>
        </div>
        {phoneDigits && (
          <Button asChild variant="outline">
            <a
              href={`https://wa.me/55${phoneDigits}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              WhatsApp
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total gasto" value={formatCurrency(stats.totalSpent)} />
        <StatCard label="Visitas" value={String(stats.visits)} />
        <StatCard
          label="Serviço favorito"
          value={stats.favoriteService ?? "—"}
        />
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {customer.notes}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento registrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.startTime)}</TableCell>
                    <TableCell>{a.service.name}</TableCell>
                    <TableCell>{a.barber.name}</TableCell>
                    <TableCell>{formatCurrency(Number(a.price))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {APPOINTMENT_STATUS_LABELS[a.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

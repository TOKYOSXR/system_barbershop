import Link from "next/link";
import { CalendarOff } from "lucide-react";

import { requireAnyPermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { listAppointments } from "@/lib/services/appointment";
import { Button } from "@/components/ui/button";
import { listBarbers } from "@/lib/services/barber";
import { listServices } from "@/lib/services/service";
import { prisma } from "@/lib/db/prisma";
import {
  addDays,
  parseISODate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toISODate,
} from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  AppointmentsClient,
  type AppointmentItem,
  type CalendarView,
} from "@/components/appointments/appointments-client";

function resolveRange(view: CalendarView, anchor: Date) {
  if (view === "day") {
    const from = startOfDay(anchor);
    return { from, to: addDays(from, 1) };
  }
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 7) };
  }
  const from = startOfMonth(anchor);
  const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return { from, to };
}

export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/agendamentos">) {
  const ctx = await requireAnyPermission([
    "appointments:view",
    "appointments:view_own",
  ]);
  const params = await searchParams;

  const view: CalendarView =
    params.view === "week" || params.view === "month"
      ? params.view
      : "day";
  const anchorISO =
    typeof params.date === "string" ? params.date : toISODate(new Date());
  const anchor = parseISODate(anchorISO);

  const { from, to } = resolveRange(view, anchor);

  const canManage = hasPermission(ctx.role, "appointments:manage");
  const canViewAll = hasPermission(ctx.role, "appointments:view");
  // A BARBER without view-all only sees their own agenda.
  const onlyBarberId = canViewAll ? undefined : (ctx.barberId ?? "__none__");

  const [appointments, barbers, servicesRes, tenant] = await Promise.all([
    listAppointments({ tenantId: ctx.tenantId, from, to, onlyBarberId }),
    listBarbers({ tenantId: ctx.tenantId }),
    listServices({ tenantId: ctx.tenantId, pageSize: 100 }),
    prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { name: true },
    }),
  ]);

  const customers = canManage
    ? await prisma.customer.findMany({
        where: { tenantId: ctx.tenantId, active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 500,
      })
    : [];

  const items: AppointmentItem[] = appointments.map((a) => ({
    id: a.id,
    customerId: a.customer.id,
    barberId: a.barber.id,
    serviceId: a.service.id,
    customerName: a.customer.name,
    customerPhone: a.customer.phone,
    barberName: a.barber.name,
    serviceName: a.service.name,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    dateISO: toISODate(a.startTime),
    price: Number(a.price),
    status: a.status,
    notes: a.notes,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Agendamentos"
        description="Visualize e gerencie a agenda."
        action={
          canManage ? (
            <Button asChild variant="outline">
              <Link href="/agendamentos/bloqueios">
                <CalendarOff />
                Bloqueios
              </Link>
            </Button>
          ) : undefined
        }
      />
      <AppointmentsClient
        view={view}
        anchorISO={anchorISO}
        appointments={items}
        customers={customers}
        barbers={barbers.map((b) => ({ id: b.id, name: b.name }))}
        services={servicesRes.items.map((s) => ({ id: s.id, name: s.name }))}
        canManage={canManage}
        barbershopName={tenant?.name ?? "Barbearia"}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_VARIANT,
  WEEKDAY_LABELS,
} from "@/lib/constants";
import {
  addDays,
  formatCurrency,
  formatTime,
  toISODate,
} from "@/lib/utils";
import {
  AppointmentFormDialog,
  type AppointmentEditValue,
  type Option,
} from "@/components/appointments/appointment-form-dialog";
import {
  AppointmentDetailDialog,
  type AppointmentDetail,
} from "@/components/appointments/appointment-detail-dialog";

export type CalendarView = "day" | "week" | "month";

export interface AppointmentItem extends AppointmentDetail {
  customerId: string;
  barberId: string;
  serviceId: string;
  dateISO: string; // yyyy-MM-dd
}

interface AppointmentsClientProps {
  view: CalendarView;
  anchorISO: string; // yyyy-MM-dd of the current period anchor
  appointments: AppointmentItem[];
  customers: Option[];
  barbers: Option[];
  services: Option[];
  canManage: boolean;
  barbershopName: string;
}

export function AppointmentsClient({
  view,
  anchorISO,
  appointments,
  customers,
  barbers,
  services,
  canManage,
  barbershopName,
}: AppointmentsClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentEditValue | null>(null);
  const [detail, setDetail] = useState<AppointmentItem | null>(null);
  const [defaultDate, setDefaultDate] = useState(anchorISO);

  const anchor = parseAnchor(anchorISO);

  const navigate = (nextView: CalendarView, nextAnchor: Date) => {
    const params = new URLSearchParams();
    params.set("view", nextView);
    params.set("date", toISODate(nextAnchor));
    router.push(`${pathname}?${params.toString()}`);
  };

  const step = (dir: number) => {
    const delta = view === "day" ? 1 : view === "week" ? 7 : 30;
    const next =
      view === "month"
        ? new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1)
        : addDays(anchor, dir * delta);
    navigate(view, next);
  };

  const openCreate = (dateISO?: string) => {
    setEditing(null);
    setDefaultDate(dateISO ?? anchorISO);
    setFormOpen(true);
  };

  const openEdit = (a: AppointmentItem) => {
    setEditing({
      id: a.id,
      customerId: a.customerId,
      barberId: a.barberId,
      serviceId: a.serviceId,
      date: a.dateISO,
      startTime: formatTime(a.startTime),
      notes: a.notes,
    });
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">
            {periodLabel(view, anchor)}
          </span>
          <Button variant="outline" size="icon" onClick={() => step(1)}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(view, new Date())}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={view}
            onChange={(e) =>
              navigate(e.target.value as CalendarView, anchor)
            }
            className="w-28"
          >
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </Select>
          {canManage && (
            <Button onClick={() => openCreate()}>
              <Plus />
              Novo
            </Button>
          )}
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          anchor={anchor}
          appointments={appointments}
          onDayClick={(iso) => navigate("day", parseAnchor(iso))}
        />
      ) : (
        <AgendaView
          view={view}
          anchor={anchor}
          appointments={appointments}
          onSelect={setDetail}
          onCreateForDay={canManage ? openCreate : undefined}
        />
      )}

      {canManage && (
        <AppointmentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          customers={customers}
          barbers={barbers}
          services={services}
          appointment={editing}
          defaultDate={defaultDate}
        />
      )}

      <AppointmentDetailDialog
        open={Boolean(detail)}
        onOpenChange={(v) => !v && setDetail(null)}
        appointment={detail}
        canManage={canManage}
        barbershopName={barbershopName}
        onEdit={detail ? () => openEdit(detail) : undefined}
      />
    </div>
  );
}

function AgendaView({
  view,
  anchor,
  appointments,
  onSelect,
  onCreateForDay,
}: {
  view: CalendarView;
  anchor: Date;
  appointments: AppointmentItem[];
  onSelect: (a: AppointmentItem) => void;
  onCreateForDay?: (iso: string) => void;
}) {
  const days = view === "day" ? [anchor] : weekDays(anchor);

  const hasAny = appointments.length > 0;
  if (!hasAny) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhum agendamento no período"
        description="Crie um novo agendamento para começar."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => {
        const iso = toISODate(day);
        const items = appointments.filter((a) => a.dateISO === iso);
        return (
          <div key={iso} className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <p className="text-sm font-medium">
                {WEEKDAY_LABELS[day.getDay()]}, {day.getDate()}/
                {day.getMonth() + 1}
              </p>
              {onCreateForDay && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateForDay(iso)}
                >
                  <Plus />
                </Button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Sem agendamentos.
              </p>
            ) : (
              <ul className="divide-y">
                {items.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(a)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                    >
                      <span className="w-14 shrink-0 text-sm font-medium tabular-nums">
                        {formatTime(a.startTime)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {a.customerName}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {a.serviceName} · {a.barberName}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={APPOINTMENT_STATUS_VARIANT[a.status]}>
                          {APPOINTMENT_STATUS_LABELS[a.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(a.price)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  anchor,
  appointments,
  onDayClick,
}: {
  anchor: Date;
  appointments: AppointmentItem[];
  onDayClick: (iso: string) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + 1,
    0,
  ).getDate();

  const countByISO = new Map<string, number>();
  for (const a of appointments) {
    countByISO.set(a.dateISO, (countByISO.get(a.dateISO) ?? 0) + 1);
  }

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
  }

  const todayISO = toISODate(new Date());

  return (
    <div className="rounded-xl border p-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`pad-${idx}`} />;
          const iso = toISODate(cell);
          const count = countByISO.get(iso) ?? 0;
          const isToday = iso === todayISO;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDayClick(iso)}
              className={`flex min-h-16 flex-col items-start rounded-md border p-1.5 text-left text-sm hover:bg-accent/50 ${
                isToday ? "border-primary" : ""
              }`}
            >
              <span className="font-medium">{cell.getDate()}</span>
              {count > 0 && (
                <span className="mt-auto rounded-full bg-primary/10 px-1.5 text-xs text-primary">
                  {count} agend.
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- helpers ---

function parseAnchor(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function weekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = addDays(anchor, diff);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function periodLabel(view: CalendarView, anchor: Date): string {
  if (view === "day") {
    return `${anchor.getDate()}/${anchor.getMonth() + 1}/${anchor.getFullYear()}`;
  }
  if (view === "week") {
    const days = weekDays(anchor);
    const start = days[0];
    const end = days[6];
    return `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}`;
  }
  return anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

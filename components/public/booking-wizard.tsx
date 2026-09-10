"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  Scissors,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, toISODate } from "@/lib/utils";
import {
  createPublicBookingAction,
  getPublicSlotsAction,
  type PublicBookingConfirmation,
} from "@/lib/actions/public-booking-actions";

interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}
interface BarberOption {
  id: string;
  name: string;
  specialties: string[];
}

interface BookingWizardProps {
  slug: string;
  tenantName: string;
  location: string;
  services: ServiceOption[];
  barbers: BarberOption[];
}

type Step = "service" | "barber" | "date" | "time" | "details" | "done";

const STEP_ORDER: Step[] = [
  "service",
  "barber",
  "date",
  "time",
  "details",
  "done",
];

export function BookingWizard({
  slug,
  tenantName,
  location,
  services,
  barbers,
}: BookingWizardProps) {
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] =
    useState<PublicBookingConfirmation | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const barber = barbers.find((b) => b.id === barberId);

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const chooseService = (id: string) => {
    setServiceId(id);
    setStep("barber");
  };

  const chooseBarber = (id: string) => {
    setBarberId(id);
    setStep("date");
  };

  const chooseDate = async (value: string) => {
    setDate(value);
    setStartTime("");
    setError(null);
    setStep("time");
    setLoadingSlots(true);
    const result = await getPublicSlotsAction(slug, barberId, serviceId, value);
    setLoadingSlots(false);
    setSlots(result.success ? (result.data ?? []) : []);
    if (!result.success) setError(result.error);
  };

  const chooseTime = (value: string) => {
    setStartTime(value);
    setStep("details");
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await createPublicBookingAction({
      slug,
      serviceId,
      barberId,
      date,
      startTime,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setConfirmation(result.data ?? null);
    setStep("done");
  };

  // Minimum selectable date is today.
  const todayISO = toISODate(new Date());

  if (step === "done" && confirmation) {
    return <Confirmation confirmation={confirmation} location={location} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator step={step} />

      {step !== "service" && (
        <button
          type="button"
          onClick={goBack}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      )}

      {step === "service" && (
        <Section title="Escolha o serviço" icon={Scissors}>
          <div className="flex flex-col gap-2">
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço disponível no momento.
              </p>
            )}
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => chooseService(s.id)}
                className="flex items-center justify-between rounded-xl border bg-card p-4 text-left hover:border-primary"
              >
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {s.durationMinutes} min
                  </span>
                </span>
                <span className="font-semibold text-primary">
                  {formatCurrency(s.price)}
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {step === "barber" && (
        <Section title="Escolha o barbeiro" icon={UsersRound}>
          <div className="flex flex-col gap-2">
            {barbers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum barbeiro disponível.
              </p>
            )}
            {barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => chooseBarber(b.id)}
                className="flex flex-col rounded-xl border bg-card p-4 text-left hover:border-primary"
              >
                <span className="font-medium">{b.name}</span>
                {b.specialties.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {b.specialties.join(", ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}

      {step === "date" && (
        <Section title="Escolha a data" icon={CalendarCheck}>
          <input
            type="date"
            min={todayISO}
            value={date}
            onChange={(e) => chooseDate(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-input bg-card px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Section>
      )}

      {step === "time" && (
        <Section title="Escolha o horário" icon={Clock}>
          {loadingSlots ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando horários...
            </p>
          ) : slots.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhum horário livre neste dia. Escolha outra data.
              </p>
              <Button variant="outline" onClick={() => setStep("date")}>
                Trocar data
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => chooseTime(slot)}
                  className="rounded-xl border bg-card py-3 text-sm font-medium hover:border-primary"
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </Section>
      )}

      {step === "details" && (
        <Section title="Seus dados" icon={Check}>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-card p-4 text-sm">
              <SummaryRow label="Serviço" value={service?.name ?? ""} />
              <SummaryRow label="Barbeiro" value={barber?.name ?? ""} />
              <SummaryRow
                label="Data"
                value={date.split("-").reverse().join("/")}
              />
              <SummaryRow label="Horário" value={startTime} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                inputMode="tel"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="lg"
              onClick={submit}
              disabled={submitting || !name || !phone}
            >
              {submitting && <Loader2 className="animate-spin" />}
              Confirmar agendamento
            </Button>
          </div>
        </Section>
      )}

      {step !== "details" && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-center text-xs text-muted-foreground">{tenantName}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ["service", "barber", "date", "time", "details"];
  const current = steps.indexOf(step === "done" ? "details" : step);
  return (
    <div className="flex gap-1.5">
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            i <= current ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Confirmation({
  confirmation,
  location,
}: {
  confirmation: PublicBookingConfirmation;
  location: string;
}) {
  const start = new Date(confirmation.startISO);
  const dateLabel = start.toLocaleDateString("pt-BR");
  const timeLabel = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const icsUrl = `/api/ics?${new URLSearchParams({
    title: `${confirmation.serviceName} - ${confirmation.barberName}`,
    start: confirmation.startISO,
    end: confirmation.endISO,
    location,
    description: `Agendamento: ${confirmation.serviceName} com ${confirmation.barberName}`,
  }).toString()}`;

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-success]/15 text-[--color-success]">
        <Check className="h-8 w-8" />
      </span>
      <div>
        <h2 className="text-xl font-bold">Agendamento confirmado</h2>
        <p className="text-sm text-muted-foreground">
          Enviamos os detalhes abaixo.
        </p>
      </div>

      <div className="w-full rounded-xl border bg-card p-5 text-left text-sm">
        <SummaryRow label="Serviço" value={confirmation.serviceName} />
        <SummaryRow label="Barbeiro" value={confirmation.barberName} />
        <SummaryRow label="Data" value={dateLabel} />
        <SummaryRow label="Horário" value={timeLabel} />
      </div>

      <Button asChild size="lg" className="w-full">
        <a href={icsUrl} download>
          <CalendarCheck />
          Adicionar ao calendário
        </a>
      </Button>
    </div>
  );
}

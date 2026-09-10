import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  Check,
  MessageSquare,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "Grátis",
    suffix: "",
    highlight: false,
    features: ["1 barbeiro", "50 agendamentos/mês", "Dashboard básico"],
  },
  {
    name: "Pro",
    price: "R$ 49,90",
    suffix: "/mês",
    highlight: true,
    features: [
      "5 barbeiros",
      "Agendamentos ilimitados",
      "Financeiro e WhatsApp",
    ],
  },
  {
    name: "Business",
    price: "R$ 99,90",
    suffix: "/mês",
    highlight: false,
    features: ["Barbeiros ilimitados", "Relatórios avançados", "Multi-unidade"],
  },
];

const features = [
  {
    icon: CalendarClock,
    title: "Agendamento online",
    description:
      "Página pública para seus clientes agendarem em segundos, direto do celular.",
  },
  {
    icon: BarChart3,
    title: "Dashboard financeiro",
    description:
      "Faturamento, ticket médio, comissões e despesas em tempo real.",
  },
  {
    icon: Users,
    title: "Gestão de clientes",
    description:
      "Histórico completo, serviços favoritos e total gasto por cliente.",
  },
  {
    icon: Scissors,
    title: "Gestão de barbeiros",
    description: "Agenda, comissões e desempenho individual de cada barbeiro.",
  },
  {
    icon: MessageSquare,
    title: "Automação e WhatsApp",
    description: "Confirmações e lembretes automáticos para reduzir faltas.",
  },
  {
    icon: Sparkles,
    title: "Relatórios",
    description: "Serviços mais vendidos, horários de pico e muito mais.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </span>
            BarberFlow
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/registrar">Começar agora</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            SaaS para barbearias
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Gerencie sua barbearia de forma simples e inteligente.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Agendamento online, controle financeiro e automações em um só lugar.
            Menos faltas, mais faturamento.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/registrar">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex flex-col gap-3 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section
          id="planos"
          className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 pb-24"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Planos para cada tamanho de barbearia
            </h2>
            <p className="mt-2 text-muted-foreground">
              Comece de graça e evolua quando precisar.
            </p>
          </div>
          <div className="grid w-full gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "border-primary ring-1 ring-primary" : ""}
              >
                <CardContent className="flex flex-col gap-4 p-6">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-2xl font-bold">
                      {plan.price}
                      {plan.suffix && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {plan.suffix}
                        </span>
                      )}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link href="/registrar">Começar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground">
          © {new Date().getFullYear()} BarberFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { changePlanAction } from "@/lib/actions/plan-actions";

interface PlanDef {
  plan: PlanType;
  label: string;
  price: number;
  features: string[];
}

const PLANS: PlanDef[] = [
  {
    plan: "FREE",
    label: "Free",
    price: 0,
    features: ["1 barbeiro", "50 agendamentos/mês", "Dashboard básico"],
  },
  {
    plan: "PRO",
    label: "Pro",
    price: 49.9,
    features: [
      "5 barbeiros",
      "Agendamentos ilimitados",
      "Dashboard completo",
      "Financeiro",
      "WhatsApp",
    ],
  },
  {
    plan: "BUSINESS",
    label: "Business",
    price: 99.9,
    features: [
      "Barbeiros ilimitados",
      "Tudo do Pro",
      "Relatórios avançados",
      "Automação",
      "Multi-unidade",
    ],
  },
];

interface PlansClientProps {
  currentPlan: PlanType;
  canManage: boolean;
}

export function PlansClient({ currentPlan, canManage }: PlansClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanType | null>(null);

  const choose = async (plan: PlanType) => {
    setLoading(plan);
    const result = await changePlanAction(plan);
    setLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Plano atualizado.");
    router.refresh();
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((p) => {
        const isCurrent = p.plan === currentPlan;
        return (
          <Card
            key={p.plan}
            className={cn(isCurrent && "border-primary ring-1 ring-primary")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{p.label}</CardTitle>
                {isCurrent && <Badge>Plano atual</Badge>}
              </div>
              <p className="text-2xl font-bold">
                {p.price === 0 ? "Grátis" : formatCurrency(p.price)}
                {p.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /mês
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[--color-success]" />
                    {f}
                  </li>
                ))}
              </ul>
              {canManage && (
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || loading !== null}
                  onClick={() => choose(p.plan)}
                >
                  {loading === p.plan && <Loader2 className="animate-spin" />}
                  {isCurrent ? "Plano atual" : "Selecionar"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

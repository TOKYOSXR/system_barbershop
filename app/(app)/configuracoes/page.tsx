import Link from "next/link";
import { CreditCard } from "lucide-react";

import { requirePermission } from "@/lib/permissions/guard";
import { hasPermission } from "@/lib/permissions/permissions";
import { getTenantSettings } from "@/lib/services/settings";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TenantInfoForm } from "@/components/settings/tenant-info-form";
import { BookingRulesForm } from "@/components/settings/booking-rules-form";

export default async function SettingsPage() {
  const ctx = await requirePermission("settings:view");
  const canManage = hasPermission(ctx.role, "settings:manage");
  const canBilling = hasPermission(ctx.role, "billing:manage");

  const tenant = await getTenantSettings(ctx.tenantId);
  if (!tenant) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <PageHeader title="Configurações" />
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados da barbearia.
        </p>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const publicUrl = `${appUrl}/barbearia/${tenant.slug}/agendar`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Configurações"
        description="Informações, regras de agendamento e plano da barbearia."
      />

      {canBilling && (
        <Link href="/configuracoes/planos" className="block sm:max-w-sm">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">Plano e assinatura</p>
                <p className="text-sm text-muted-foreground">
                  Gerencie seu plano
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <TenantInfoForm
        defaults={{
          name: tenant.name,
          phone: tenant.phone ?? "",
          email: tenant.email ?? "",
          address: tenant.address ?? "",
          city: tenant.city ?? "",
          state: tenant.state ?? "",
          zipCode: tenant.zipCode ?? "",
        }}
        publicUrl={publicUrl}
        canManage={canManage}
      />

      <BookingRulesForm
        defaults={{
          minLeadTimeMinutes: tenant.minLeadTimeMinutes,
          maxFutureDays: tenant.maxFutureDays,
          allowCancellation: tenant.allowCancellation,
          minCancelTimeMinutes: tenant.minCancelTimeMinutes,
          slotIntervalMinutes: tenant.slotIntervalMinutes,
        }}
        canManage={canManage}
      />
    </div>
  );
}

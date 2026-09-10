import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/lib/permissions/guard";
import { listBlockedTimes } from "@/lib/services/schedule";
import { listBarbers } from "@/lib/services/barber";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  BlockedTimesClient,
  type BlockRow,
} from "@/components/schedule/blocked-times-client";

export default async function BlockedTimesPage() {
  const ctx = await requirePermission("appointments:manage");

  const [rows, barbers] = await Promise.all([
    listBlockedTimes(ctx.tenantId, undefined, new Date()),
    listBarbers({ tenantId: ctx.tenantId }),
  ]);

  const blocks: BlockRow[] = rows.map((r) => ({
    id: r.id,
    barberName: r.barber.name,
    date: r.date.toISOString(),
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    reason: r.reason,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <Link
        href="/agendamentos"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a agenda
      </Link>
      <PageHeader
        title="Bloqueios de horário"
        description="Almoço, folgas, férias e outros períodos indisponíveis."
      />
      <BlockedTimesClient
        blocks={blocks}
        barbers={barbers.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}

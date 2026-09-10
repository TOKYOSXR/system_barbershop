import { requireSession } from "@/lib/auth/session";
import { getTenantById } from "@/lib/services/tenant";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireSession();
  const tenant = await getTenantById(ctx.tenantId);
  const tenantName = tenant?.name ?? "Barbearia";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={ctx.role} tenantName={tenantName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={ctx.name}
          email={ctx.email}
          role={ctx.role}
          tenantName={tenantName}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav role={ctx.role} />
      </div>
    </div>
  );
}

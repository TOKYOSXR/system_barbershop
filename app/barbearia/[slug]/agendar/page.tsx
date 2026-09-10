import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";

import {
  getPublicBarbers,
  getPublicServices,
  getPublicTenant,
} from "@/lib/services/public-booking";
import { BookingWizard } from "@/components/public/booking-wizard";

export async function generateMetadata({
  params,
}: PageProps<"/barbearia/[slug]/agendar">) {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  return {
    title: tenant ? `Agendar · ${tenant.name}` : "Agendar",
  };
}

export default async function PublicBookingPage({
  params,
}: PageProps<"/barbearia/[slug]/agendar">) {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (!tenant) notFound();

  const [services, barbers] = await Promise.all([
    getPublicServices(tenant.id),
    getPublicBarbers(tenant.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-bold leading-tight">{tenant.name}</h1>
            {(tenant.city || tenant.address) && (
              <p className="text-xs text-muted-foreground">
                {[tenant.address, tenant.city, tenant.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <BookingWizard
          slug={tenant.slug}
          tenantName={tenant.name}
          location={[tenant.address, tenant.city, tenant.state]
            .filter(Boolean)
            .join(", ")}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: Number(s.price),
          }))}
          barbers={barbers.map((b) => ({
            id: b.id,
            name: b.name,
            specialties: b.specialties,
          }))}
        />
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        Agendamento online por BarberFlow
      </footer>
    </div>
  );
}

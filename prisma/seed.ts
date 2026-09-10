import {
  AppointmentStatus,
  CommissionStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  TransactionType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

// Prefer the direct connection (5432) for the seed script. The Supabase
// transaction pooler (6543) can reject long-lived script connections.
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
  },
});

const SLUG = "barbearia-modelo";

async function main() {
  console.log("Seeding database...");

  // Idempotency: start clean for the demo tenant.
  const existing = await prisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
    console.log("Removed previous demo tenant.");
  }

  const passwordHash = await bcrypt.hash("senha1234", 12);

  // 1 barbershop + owner + subscription
  const tenant = await prisma.tenant.create({
    data: {
      name: "Barbearia Modelo",
      slug: SLUG,
      email: "contato@barbeariamodelo.com",
      phone: "(11) 99999-0000",
      city: "São Paulo",
      state: "SP",
      subscription: { create: { plan: "PRO", status: "ACTIVE" } },
      users: {
        create: {
          name: "Dono da Barbearia",
          email: "dono@barbeariamodelo.com",
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  // 3 barbers (2 also have user logins)
  const barberData = [
    { name: "João Silva", commission: 45, email: "joao@barbeariamodelo.com" },
    { name: "Carlos Souza", commission: 40, email: "carlos@barbeariamodelo.com" },
    { name: "Rafael Lima", commission: 50, email: null },
  ];

  const barbers = [];
  for (const b of barberData) {
    const data: Prisma.BarberCreateInput = {
      tenant: { connect: { id: tenant.id } },
      name: b.name,
      email: b.email,
      commissionPercentage: b.commission,
      specialties: ["Corte", "Barba"],
      // Mon-Sat 09:00-18:00
      workingHours: {
        create: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          tenantId: tenant.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "18:00",
        })),
      },
    };

    if (b.email) {
      data.user = {
        create: {
          tenantId: tenant.id,
          name: b.name,
          email: b.email,
          passwordHash,
          role: UserRole.BARBER,
        },
      };
    }

    const barber = await prisma.barber.create({ data });
    barbers.push(barber);
  }

  // 6 services
  const serviceData = [
    { name: "Corte", duration: 30, price: 40 },
    { name: "Barba", duration: 20, price: 30 },
    { name: "Corte + Barba", duration: 50, price: 65 },
    { name: "Sobrancelha", duration: 15, price: 20 },
    { name: "Platinado", duration: 90, price: 150 },
    { name: "Pigmentação", duration: 40, price: 70 },
  ];

  const services = [];
  for (const s of serviceData) {
    const service = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: s.name,
        durationMinutes: s.duration,
        price: s.price,
      },
    });
    services.push(service);
  }

  // 20 customers
  const firstNames = [
    "Pedro", "Lucas", "Marcos", "Felipe", "Bruno", "Gustavo", "André",
    "Thiago", "Rodrigo", "Diego", "Vinícius", "Matheus", "Gabriel", "Leonardo",
    "Daniel", "Eduardo", "Henrique", "Ricardo", "Fábio", "Alexandre",
  ];
  const customers = [];
  for (let i = 0; i < firstNames.length; i++) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: `${firstNames[i]} Cliente`,
        phone: `1198${String(1000000 + i).padStart(7, "0")}`,
        email: `${firstNames[i].toLowerCase()}@exemplo.com`,
      },
    });
    customers.push(customer);
  }

  // Appointments across the last 30 days + a few upcoming.
  const now = new Date();
  let completedCount = 0;

  for (let dayOffset = -30; dayOffset <= 3; dayOffset++) {
    // 2-5 appointments per day
    const perDay = 2 + Math.floor(Math.random() * 4);
    for (let n = 0; n < perDay; n++) {
      const day = new Date(now);
      day.setDate(now.getDate() + dayOffset);
      const dow = day.getDay();
      if (dow === 0) continue; // barbershop closed on Sundays

      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];

      const startHour = 9 + Math.floor(Math.random() * 8); // 09h-16h
      const start = new Date(day);
      start.setHours(startHour, n % 2 === 0 ? 0 : 30, 0, 0);
      const end = new Date(start.getTime() + service.durationMinutes * 60000);

      const dateOnly = new Date(
        Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()),
      );

      let status: AppointmentStatus;
      if (dayOffset < 0) {
        const roll = Math.random();
        status =
          roll < 0.8
            ? AppointmentStatus.COMPLETED
            : roll < 0.9
              ? AppointmentStatus.CANCELLED
              : AppointmentStatus.NO_SHOW;
      } else {
        status = AppointmentStatus.SCHEDULED;
      }

      const price = Number(service.price);

      const appointment = await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          barberId: barber.id,
          serviceId: service.id,
          date: dateOnly,
          startTime: start,
          endTime: end,
          status,
          price,
          paymentStatus:
            status === AppointmentStatus.COMPLETED
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING,
          paymentMethod:
            status === AppointmentStatus.COMPLETED
              ? PaymentMethod.PIX
              : null,
        },
      });

      if (status === AppointmentStatus.COMPLETED) {
        completedCount++;
        const commissionPct = Number(barber.commissionPercentage);
        const commissionAmount = (price * commissionPct) / 100;

        await prisma.financialTransaction.create({
          data: {
            tenantId: tenant.id,
            appointmentId: appointment.id,
            barberId: barber.id,
            type: TransactionType.INCOME,
            amount: price,
            description: `${service.name} - ${customer.name}`,
            paymentMethod: PaymentMethod.PIX,
            transactionDate: start,
          },
        });

        await prisma.commission.create({
          data: {
            tenantId: tenant.id,
            barberId: barber.id,
            appointmentId: appointment.id,
            percentage: commissionPct,
            amount: commissionAmount,
            status: CommissionStatus.PENDING,
          },
        });

        await prisma.customer.update({
          where: { id: customer.id },
          data: { lastVisitAt: start },
        });
      }
    }
  }

  // A few expenses.
  await prisma.financialTransaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: TransactionType.EXPENSE,
        amount: 1200,
        description: "Aluguel",
        transactionDate: new Date(now.getFullYear(), now.getMonth(), 5),
      },
      {
        tenantId: tenant.id,
        type: TransactionType.EXPENSE,
        amount: 450,
        description: "Produtos",
        transactionDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
    ],
  });

  console.log("Seed completed:");
  console.log(`  Tenant: ${tenant.name} (slug: ${tenant.slug})`);
  console.log(`  Barbers: ${barbers.length}`);
  console.log(`  Services: ${services.length}`);
  console.log(`  Customers: ${customers.length}`);
  console.log(`  Completed appointments: ${completedCount}`);
  console.log("");
  console.log("Login (OWNER): dono@barbeariamodelo.com / senha1234");
  console.log("Login (BARBER): joao@barbeariamodelo.com / senha1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

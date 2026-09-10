import {
  AppointmentStatus,
  CommissionStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TransactionType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { calcCommission } from "@/lib/finance/commission";
import type { UpdateStatusInput } from "@/lib/validations/appointment";

/**
 * Applies a status change to an appointment, running the side effects required
 * by section 32:
 *  - COMPLETED: create financial income transaction + commission, mark paid,
 *    update customer's last_visit_at (all in one transaction).
 *  - Reverting away from COMPLETED: remove the derived transaction/commission.
 *  - CANCELLED / NO_SHOW: never generate commission/income.
 */
export async function changeAppointmentStatus(
  tenantId: string,
  id: string,
  input: UpdateStatusInput,
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, tenantId },
    include: { barber: { select: { commissionPercentage: true } } },
  });
  if (!appointment) return { notFound: true as const };

  const previousStatus = appointment.status;
  const nextStatus = input.status;

  await prisma.$transaction(async (tx) => {
    const becameCompleted =
      nextStatus === AppointmentStatus.COMPLETED &&
      previousStatus !== AppointmentStatus.COMPLETED;
    const leftCompleted =
      previousStatus === AppointmentStatus.COMPLETED &&
      nextStatus !== AppointmentStatus.COMPLETED;

    // Base status update.
    const data: Prisma.AppointmentUpdateManyMutationInput = {
      status: nextStatus,
    };

    if (becameCompleted) {
      const price = Number(appointment.price);
      const pct = Number(appointment.barber.commissionPercentage);
      const commissionAmount = calcCommission(price, pct);
      const paymentMethod = input.paymentMethod ?? PaymentMethod.CASH;

      data.paymentStatus = input.paymentStatus ?? PaymentStatus.PAID;
      data.paymentMethod = paymentMethod;

      await tx.financialTransaction.create({
        data: {
          tenantId,
          appointmentId: id,
          barberId: appointment.barberId,
          type: TransactionType.INCOME,
          amount: price,
          paymentMethod,
          transactionDate: appointment.startTime,
        },
      });

      await tx.commission.upsert({
        where: { appointmentId: id },
        create: {
          tenantId,
          barberId: appointment.barberId,
          appointmentId: id,
          percentage: pct,
          amount: commissionAmount,
          status: CommissionStatus.PENDING,
        },
        update: {
          percentage: pct,
          amount: commissionAmount,
        },
      });

      await tx.customer.update({
        where: { id: appointment.customerId },
        data: { lastVisitAt: appointment.startTime },
      });
    }

    if (leftCompleted) {
      // Undo the derived financial records; no revenue for cancelled/no-show.
      await tx.financialTransaction.deleteMany({
        where: { tenantId, appointmentId: id, type: TransactionType.INCOME },
      });
      await tx.commission.deleteMany({ where: { tenantId, appointmentId: id } });
      data.paymentStatus = PaymentStatus.PENDING;
      data.paymentMethod = null;
    }

    await tx.appointment.updateMany({ where: { id, tenantId }, data });
  });

  return { notFound: false as const, previousStatus, nextStatus };
}

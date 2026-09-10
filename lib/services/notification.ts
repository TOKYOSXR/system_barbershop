import {
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { buildMessage, type MessageContext } from "@/lib/notifications/templates";
import { sendMessage } from "@/lib/notifications/provider";
import { formatDate, formatTime } from "@/lib/utils";

/** Builds the template context from an appointment id (tenant-scoped). */
async function buildContext(
  tenantId: string,
  appointmentId: string,
): Promise<{ ctx: MessageContext; recipient: string } | null> {
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      customer: { select: { name: true, phone: true, email: true } },
      barber: { select: { name: true } },
      service: { select: { name: true } },
      tenant: { select: { name: true } },
    },
  });
  if (!appt) return null;

  return {
    ctx: {
      customerName: appt.customer.name,
      barbershopName: appt.tenant.name,
      serviceName: appt.service.name,
      barberName: appt.barber.name,
      dateLabel: formatDate(appt.startTime),
      timeLabel: formatTime(appt.startTime),
    },
    recipient: appt.customer.phone,
  };
}

/**
 * Queues a notification (status PENDING). If `sendNow`, immediately attempts
 * delivery through the provider and records SENT/FAILED.
 */
export async function queueNotification(params: {
  tenantId: string;
  appointmentId: string;
  type: NotificationType;
  channel?: NotificationChannel;
  scheduledFor?: Date;
  sendNow?: boolean;
}): Promise<void> {
  const {
    tenantId,
    appointmentId,
    type,
    channel = NotificationChannel.WHATSAPP,
    scheduledFor,
    sendNow = false,
  } = params;

  const built = await buildContext(tenantId, appointmentId);
  if (!built) return;

  const message = buildMessage(type, built.ctx);

  const notification = await prisma.notification.create({
    data: {
      tenantId,
      appointmentId,
      channel,
      type,
      recipient: built.recipient,
      payload: { message },
      scheduledFor: scheduledFor ?? null,
      status: NotificationStatus.PENDING,
    },
  });

  if (sendNow) {
    await dispatchNotification(notification.id, channel, built.recipient, message);
  }
}

async function dispatchNotification(
  id: string,
  channel: NotificationChannel,
  recipient: string,
  message: string,
): Promise<void> {
  const result = await sendMessage({ channel, recipient, message });
  await prisma.notification.update({
    where: { id },
    data: {
      status: result.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
      sentAt: result.ok ? new Date() : null,
    },
  });
}

/**
 * Cron entry point: creates reminders for appointments happening in the next
 * ~24h that don't have a reminder yet, then dispatches all due PENDING
 * notifications (scheduledFor <= now). Returns counts for observability.
 */
export async function runReminderJob(): Promise<{
  created: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Appointments in the next 24h without a reminder notification yet.
  const upcoming = await prisma.appointment.findMany({
    where: {
      startTime: { gte: now, lte: windowEnd },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      },
      notifications: {
        none: { type: NotificationType.APPOINTMENT_REMINDER },
      },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      barber: { select: { name: true } },
      service: { select: { name: true } },
      tenant: { select: { name: true } },
    },
    take: 200,
  });

  let created = 0;
  for (const appt of upcoming) {
    const message = buildMessage(NotificationType.APPOINTMENT_REMINDER, {
      customerName: appt.customer.name,
      barbershopName: appt.tenant.name,
      serviceName: appt.service.name,
      barberName: appt.barber.name,
      dateLabel: formatDate(appt.startTime),
      timeLabel: formatTime(appt.startTime),
    });
    await prisma.notification.create({
      data: {
        tenantId: appt.tenantId,
        appointmentId: appt.id,
        channel: NotificationChannel.WHATSAPP,
        type: NotificationType.APPOINTMENT_REMINDER,
        recipient: appt.customer.phone,
        payload: { message },
        scheduledFor: now,
        status: NotificationStatus.PENDING,
      },
    });
    created += 1;
  }

  // Dispatch all due pending notifications.
  const due = await prisma.notification.findMany({
    where: {
      status: NotificationStatus.PENDING,
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    take: 500,
  });

  let sent = 0;
  let failed = 0;
  for (const n of due) {
    const payload = (n.payload ?? {}) as { message?: string };
    const message = payload.message ?? "";
    const result = await sendMessage({
      channel: n.channel,
      recipient: n.recipient,
      message,
    });
    await prisma.notification.update({
      where: { id: n.id },
      data: {
        status: result.ok
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
        sentAt: result.ok ? new Date() : null,
      },
    });
    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { created, sent, failed };
}

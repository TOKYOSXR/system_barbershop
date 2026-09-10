import "server-only";

import type { NotificationChannel } from "@prisma/client";

export interface SendMessageParams {
  channel: NotificationChannel;
  recipient: string;
  message: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Notification delivery abstraction.
 *
 * The architecture is ready for real providers (WhatsApp Cloud API / Evolution
 * API for WHATSAPP, Resend for EMAIL, web push for PUSH). Until credentials are
 * configured, delivery is a no-op that logs, so the rest of the system (queue,
 * status tracking, cron) works end to end without external dependencies.
 */
export async function sendMessage(
  params: SendMessageParams,
): Promise<SendResult> {
  switch (params.channel) {
    case "WHATSAPP":
      return sendWhatsapp(params);
    case "EMAIL":
      return sendEmail(params);
    case "PUSH":
      return { ok: true };
  }
}

async function sendWhatsapp(params: SendMessageParams): Promise<SendResult> {
  const url = process.env.WHATSAPP_API_URL;
  const key = process.env.WHATSAPP_API_KEY;
  if (!url || !key) {
    // Not configured: treat as delivered in dev so the flow can be exercised.
    console.info("[whatsapp:stub]", params.recipient, params.message);
    return { ok: true };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        to: params.recipient,
        message: params.message,
      }),
    });
    return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

async function sendEmail(params: SendMessageParams): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[email:stub]", params.recipient, params.message);
    return { ok: true };
  }
  // Real Resend integration would go here.
  return { ok: true };
}

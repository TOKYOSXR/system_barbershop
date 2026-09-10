import type { NextRequest } from "next/server";

import { runReminderJob } from "@/lib/services/notification";

/**
 * Reminder cron endpoint (section 17). Intended to be triggered by Vercel Cron.
 * Protected by a bearer token so it cannot be invoked publicly.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
 * CRON_SECRET is set in the project environment.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runReminderJob();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Reminder job failed", error);
    return Response.json(
      { ok: false, error: "Reminder job failed" },
      { status: 500 },
    );
  }
}

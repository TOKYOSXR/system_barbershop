import type { NextRequest } from "next/server";

import { buildICS } from "@/lib/ics";

/**
 * Generates a downloadable .ics file for a booking confirmation.
 * All event details are passed as query params (public, non-sensitive).
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = params.get("title") ?? "Agendamento";
  const start = params.get("start");
  const end = params.get("end");
  const location = params.get("location") ?? undefined;
  const description = params.get("description") ?? undefined;

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (
    !startDate ||
    !endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return new Response("Parâmetros inválidos", { status: 400 });
  }

  const ics = buildICS({
    uid: `${startDate.getTime()}@barberflow`,
    title,
    start: startDate,
    end: endDate,
    location,
    description,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agendamento.ics"',
    },
  });
}

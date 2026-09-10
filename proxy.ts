import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight edge guard: redirects to /login when no auth cookie is present.
 * The authoritative authorization check happens server-side via
 * `requireSession()` / permission helpers in each route.
 *
 * In Next.js 16 this file convention is called "proxy" (formerly middleware).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agendamentos/:path*",
    "/clientes/:path*",
    "/barbeiros/:path*",
    "/servicos/:path*",
    "/financeiro/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};

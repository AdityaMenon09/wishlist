import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (await isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except: login, the cron endpoint (has its own secret), static assets,
  // and the PWA manifest/icons (browsers fetch those without cookies).
  matcher: ["/((?!login|api/cron|_next/static|_next/image|icons/|icon.svg|manifest.webmanifest|robots.txt).*)"],
};

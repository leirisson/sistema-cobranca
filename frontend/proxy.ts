import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "session";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(COOKIE_NAME);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};

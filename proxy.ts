import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const RECOVERY_PATH = "/recovery";
const RECOVERY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function proxy(request: NextRequest) {
  if (process.env.AUGNES_RECOVERY_MODE !== "1") {
    return NextResponse.next();
  }

  if (isRecoveryModePath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (
    request.nextUrl.pathname.startsWith("/api/") ||
    (request.method !== "GET" && request.method !== "HEAD")
  ) {
    return NextResponse.json(
      {
        error_code: "recovery_mode_write_refused",
        next_action: "use_the_recovery_page",
      },
      { status: 503, headers: RECOVERY_HEADERS },
    );
  }

  const destination = request.nextUrl.clone();
  destination.pathname = RECOVERY_PATH;
  destination.search = "";
  const response = NextResponse.redirect(destination, 307);
  for (const [key, value] of Object.entries(RECOVERY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function isRecoveryModePath(pathname: string): boolean {
  return (
    pathname === RECOVERY_PATH ||
    pathname === "/api/recovery" ||
    pathname === "/api/healthz" ||
    pathname === "/favicon.ico" ||
    pathname === "/static" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/")
  );
}

export const config = {
  matcher: ["/:path*"],
};

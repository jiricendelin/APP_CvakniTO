import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { CSRF_COOKIE } from "@/lib/auth/csrf-shared";

const PUBLIC_PAGE_PATHS = ["/login"];

function isPwaAsset(pathname: string): boolean {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon/") ||
    pathname === "/apple-icon" ||
    pathname.startsWith("/apple-icon/")
  );
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isPublicApi(pathname: string): boolean {
  if (pathname === "/api/health" || pathname.startsWith("/api/health/")) {
    return true;
  }
  if (pathname.startsWith("/api/bank")) {
    return true;
  }
  return false;
}

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET || "";
  if (!token || !secret) return null;
  return verifySession(token, secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPwaAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    const uid = await resolveUserId(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_PAGE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const uid = await resolveUserId(req);

  if (!uid && !isPublicPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (uid && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  let csrf = req.cookies.get(CSRF_COOKIE)?.value;
  const requestHeaders = new Headers(req.headers);
  let isNewCsrf = false;
  if (!csrf) {
    csrf = randomToken();
    isNewCsrf = true;
    const existing = req.headers.get("cookie");
    requestHeaders.set(
      "cookie",
      `${existing ? existing + "; " : ""}${CSRF_COOKIE}=${csrf}`
    );
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (isNewCsrf) {
    res.cookies.set(CSRF_COOKIE, csrf, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

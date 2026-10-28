import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function computeToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("cmt-admin-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get("cmt_admin")?.value;
  const password = process.env.ADMIN_PASSWORD;

  if (!password || !cookie) {
    return false;
  }

  const expected = await computeToken(password);
  return cookie === expected;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes under /api/admin/* use the same HMAC-cookie auth as the
  // admin UI. Login/logout stay public; everything else returns 401 JSON
  // (never a redirect) when the cookie is missing or invalid.
  if (pathname.startsWith("/api/admin/")) {
    if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
      return NextResponse.next();
    }

    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await isAuthenticated(request))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

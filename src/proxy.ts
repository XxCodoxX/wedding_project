import { NextRequest, NextResponse } from "next/server";
import { createAuthMiddlewareClient } from "@/lib/supabase-auth";
import {
  LAST_ACTIVE_COOKIE,
  checkAdminSession,
  createLastActiveCookie,
  lastActiveCookieOptions,
} from "@/lib/admin-session";

/** Verify the session and apply the app's session limits (see lib/admin-session.ts). */
async function verifyAdmin(request: NextRequest) {
  const auth = await createAuthMiddlewareClient(request);
  if (!auth.claims) return { ...auth, verdict: null };
  const verdict = await checkAdminSession(auth.claims, request.cookies.get(LAST_ACTIVE_COOKIE)?.value);
  return { ...auth, verdict };
}

/**
 * End an over-limit session: revoke its refresh token (this session only — the admin's other
 * devices are unaffected), then hand back a response carrying the cleared auth cookies.
 */
async function endSession(
  auth: Awaited<ReturnType<typeof createAuthMiddlewareClient>>,
  redirectTo: URL | null
): Promise<NextResponse> {
  await auth.supabase.auth.signOut({ scope: "local" });
  const cleared = auth.getResponse();
  const response = redirectTo ? NextResponse.redirect(redirectTo) : cleared;
  if (redirectTo) cleared.cookies.getAll().forEach((c) => response.cookies.set(c));
  response.cookies.delete(LAST_ACTIVE_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Fast check: check if any Supabase auth token cookie exists
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) =>
    c.name.includes("-auth-token") || c.name.startsWith("sb-")
  );

  // Allow logout route through
  if (pathname === "/admin/logout") {
    return NextResponse.next();
  }

  // Allow the login page through
  if (pathname === "/admin/login") {
    // If no auth cookie, immediately let them see the login form without calling Supabase API
    if (!hasAuthCookie) {
      return NextResponse.next();
    }

    const auth = await verifyAdmin(request);
    if (auth.verdict === "ok") {
      return NextResponse.redirect(new URL("/admin/events", request.url));
    }
    // A leftover over-limit session: clear it so the login form starts clean.
    if (auth.verdict) return endSession(auth, null);
    return auth.getResponse();
  }

  // If no auth cookie at all, immediately redirect to login (0 external API calls)
  if (!hasAuthCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Skip external Supabase Auth API calls on Next.js background prefetch requests
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (isPrefetch) {
    return NextResponse.next();
  }

  // For real user page navigation, verify authentication and refresh session cookies
  const auth = await verifyAdmin(request);

  if (!auth.claims) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (auth.verdict !== "ok") {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("reason", auth.verdict === "idle" ? "idle" : "expired");
    return endSession(auth, loginUrl);
  }

  // A real page request is activity: restart the idle clock.
  const response = auth.getResponse();
  response.cookies.set(LAST_ACTIVE_COOKIE, await createLastActiveCookie(auth.claims.session_id), lastActiveCookieOptions);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};

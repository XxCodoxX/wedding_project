import { NextRequest, NextResponse } from "next/server";
import { createAuthMiddlewareClient } from "@/lib/supabase-auth";

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

  // Allow the login page through
  if (pathname === "/admin/login") {
    // If no auth cookie, immediately let them see the login form without calling Supabase API
    if (!hasAuthCookie) {
      return NextResponse.next();
    }

    const { user, response } = await createAuthMiddlewareClient(request);
    if (user) {
      return NextResponse.redirect(new URL("/admin/events", request.url));
    }
    return response;
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
  const { user, response } = await createAuthMiddlewareClient(request);

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};


import { NextRequest, NextResponse } from "next/server";
import { createAuthMiddlewareClient } from "@/lib/supabase-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow the login page through
  if (pathname === "/admin/login") {
    const { user, response } = await createAuthMiddlewareClient(request);

    // If already logged in, redirect to events
    if (user) {
      return NextResponse.redirect(new URL("/admin/events", request.url));
    }

    return response;
  }

  // For all other /admin routes, require authentication
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

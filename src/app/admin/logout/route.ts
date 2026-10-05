import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { LAST_ACTIVE_COOKIE } from "@/lib/admin-session";

export async function GET(request: NextRequest) {
  // If this is a prefetch request from Next.js, DO NOT sign out!
  const url = request.nextUrl;
  const isPrefetch =
    url.searchParams.has("_rsc") ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (isPrefetch) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  (await cookies()).delete(LAST_ACTIVE_COOKIE);

  return NextResponse.redirect(new URL("/admin/login", request.url));
}


import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { LAST_ACTIVE_COOKIE, createLastActiveCookie, lastActiveCookieOptions } from "@/lib/admin-session";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createAuthServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Start the idle clock for this session (see lib/admin-session.ts).
    const { data: claimsData } = await supabase.auth.getClaims();
    const sessionId = claimsData?.claims?.session_id;
    if (!sessionId) {
      return NextResponse.json({ error: "Could not start a session" }, { status: 500 });
    }
    const cookieStore = await cookies();
    cookieStore.set(LAST_ACTIVE_COOKIE, await createLastActiveCookie(sessionId), lastActiveCookieOptions);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

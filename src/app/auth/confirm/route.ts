import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { LAST_ACTIVE_COOKIE } from "@/lib/admin-session";

/**
 * Landing route for the password-reset email link. Turns the link's one-time token into a
 * recovery session and forwards to the reset form.
 *
 * Accepts both link styles Supabase can send:
 * - `?code=` (PKCE, the default template): only works in the browser that requested the reset,
 *   because the code verifier lives in that browser's cookies.
 * - `?token_hash=&type=recovery` (custom email template): works on any device.
 *
 * Deliberately does NOT set the admin activity cookie: without it the recovery session counts as
 * idle everywhere except /admin/reset-password (see proxy.ts), so a reset link can only be used to
 * change the password, not to browse the admin.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createAuthServerClient();
  let ok = false;

  try {
    if (code) {
      ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
    } else if (tokenHash && type === "recovery") {
      ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })).error;
    }
  } catch (err) {
    console.error("Password reset link verification failed:", err);
  }

  if (!ok) {
    const url = new URL("/admin/forgot-password", request.url);
    url.searchParams.set("error", "invalid-link");
    return NextResponse.redirect(url);
  }

  (await cookies()).delete(LAST_ACTIVE_COOKIE);
  return NextResponse.redirect(new URL("/admin/reset-password", request.url));
}

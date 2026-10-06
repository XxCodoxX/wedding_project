import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase-auth";

const bodySchema = z.object({ email: z.email().max(254) });

/**
 * Email a password-reset link. The link opens /auth/confirm, which starts a recovery session and
 * forwards to /admin/reset-password.
 *
 * Always answers with the same success message, whether or not the email has an account, so the
 * form can't be used to find out who is registered. Sending is rate-limited by Supabase Auth.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  try {
    const supabase = await createAuthServerClient();
    // Supabase only honours redirectTo when it's in the project's Redirect URLs allow-list,
    // so a spoofed Host header can't point the email at another site.
    const redirectTo = new URL("/auth/confirm", request.url).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email.trim().toLowerCase(), {
      redirectTo,
    });

    if (error) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Too many reset requests. Please wait a while and try again." },
          { status: 429 }
        );
      }
      // Log but don't reveal: the error may say whether the account exists.
      console.error("Password reset email failed:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password reset request failed:", err);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

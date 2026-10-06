import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { LAST_ACTIVE_COOKIE } from "@/lib/admin-session";

const bodySchema = z.object({
  // Same minimum as admin-created accounts (lib/user-actions.ts) and Supabase's own setting.
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

/**
 * Set a new password for the user signed in by the reset link (/auth/confirm), then sign them out
 * everywhere: this ends the recovery session and any session someone else may hold with the old password.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createAuthServerClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) {
      return NextResponse.json(
        { error: "Your reset link has expired. Please request a new one." },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      // e.g. "New password should be different from the old password." or a weak-password rule.
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.auth.signOut({ scope: "global" });
    (await cookies()).delete(LAST_ACTIVE_COOKIE);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password reset failed:", err);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

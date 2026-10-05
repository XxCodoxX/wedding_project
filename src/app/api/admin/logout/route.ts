import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { LAST_ACTIVE_COOKIE } from "@/lib/admin-session";

export async function POST() {
  try {
    const supabase = await createAuthServerClient();
    await supabase.auth.signOut();
    (await cookies()).delete(LAST_ACTIVE_COOKIE);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to sign out" },
      { status: 500 }
    );
  }
}

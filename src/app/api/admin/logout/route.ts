import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-auth";

export async function POST() {
  try {
    const supabase = await createAuthServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to sign out" },
      { status: 500 }
    );
  }
}

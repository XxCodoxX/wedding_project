import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/admin/login", baseUrl));
}

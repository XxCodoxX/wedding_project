import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/auth";

export async function GET() {
  const profile = await getUserProfile();

  if (!profile) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    assigned_wedding_id: profile.assigned_wedding_id,
  });
}

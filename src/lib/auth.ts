import { cache } from "react";
import { createAuthServerClient } from "@/lib/supabase-auth";
import { createServerClient } from "@/lib/supabase";

export type UserRole = "admin" | "guest";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_wedding_id: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Check if the current user is authenticated.
 * Returns the verified identity from the session JWT, or null.
 *
 * Uses getClaims(): with the project's asymmetric (ES256) signing key the JWT is verified
 * locally against the cached JWKS, so this costs no Auth API round trip (getUser() always did).
 * Memoized per request so layout + page share one check.
 */
export const getAuthUser = cache(async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const { sub, email, user_metadata } = data.claims;
  return { id: sub, email, user_metadata };
});

/**
 * Get the current user's profile including role and assigned wedding.
 * Returns null if not authenticated or no profile exists.
 * Memoized per request (React `cache`), so layout + page + access checks share one Auth/DB lookup.
 */
export const getUserProfile = cache(async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (profile) return profile;

  // Auto-bootstrap: If user is authenticated but no profiles exist yet,
  // automatically create the first user as an Admin
  const { count } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  if (count === 0) {
    const { data: newProfile } = await supabase
      .from("user_profiles")
      .insert({
        auth_user_id: user.id,
        email: user.email || "",
        full_name: (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "Admin",
        role: "admin",
      })
      .select()
      .single();

    return newProfile || null;
  }

  return null;
});

/**
 * Check if the current user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin";
}

/**
 * Check if the current user has access to a specific wedding.
 * Admins can access all weddings; guest users can only access their assigned wedding.
 */
export async function canAccessWedding(weddingId: string): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return profile.assigned_wedding_id === weddingId;
}

/**
 * Verify if there is an active session.
 * Returns true if the user is authenticated, false otherwise.
 */
export async function verifySession(): Promise<boolean> {
  const user = await getAuthUser();
  return !!user;
}

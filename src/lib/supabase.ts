import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------- Types ----------
export interface Wedding {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  venue_name: string;
  venue_location: string;
  location_url: string | null;
  template_id: string; // Now a text ID referencing a local template (e.g. 'classic')
  main_image_url: string | null;
  gallery_image_urls: string[];
  created_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  guest_name: string;
  custom_message: string | null;
  rsvp_status: "pending" | "attending" | "not_attending";
  created_at: string;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: "admin" | "guest";
  assigned_wedding_id: string | null;
  created_at: string;
}


// ---------- Browser Client (public, anon key — for client-side storage uploads) ----------
let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserClient = createClient(url, anonKey);
  return browserClient;
}

// ---------- Server Client (service role key — bypasses RLS, server-only) ----------
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

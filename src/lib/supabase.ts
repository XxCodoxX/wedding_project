import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface AgendaItem {
  time: string;
  title: string;
  description: string;
}

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
  custom_message?: string | null;
  agenda_items?: AgendaItem[] | null;
  whatsapp_message_template?: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  guest_name: string;
  custom_message: string | null;
  invitation_type: "individual" | "couple" | "family";
  group_id: string | null;
  group_label: string | null;
  is_primary: boolean;
  /** E.164 WhatsApp number, on the primary guest only. Null until migration 11 is run. */
  phone?: string | null;
  /** Bride's or groom's side, on every member of an invitation. Undefined until migration 14 is run. */
  guest_side?: "bride" | "groom" | null;
  /** Delivery tracking (primary guest only). Undefined until migration 12 is run. */
  invite_sent_at?: string | null;
  invite_first_opened_at?: string | null;
  invite_last_opened_at?: string | null;
  invite_open_count?: number;
  rsvp_status: "pending" | "attending" | "not_attending";
  /** Wishes the guest wrote with their RSVP. Undefined until migration 16 is run. */
  rsvp_message?: string | null;
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

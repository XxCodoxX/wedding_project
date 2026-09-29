import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components (auth session from browser cookies).
 * Kept apart from supabase-auth.ts, which imports next/headers and is server-only.
 * createBrowserClient returns a singleton in the browser, so calling this repeatedly is cheap.
 */
export function createAuthBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

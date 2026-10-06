import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error_code?: string }>;
}) {
  // Supabase sends failed email links (e.g. an expired or already-used reset link) to the Site URL
  // with ?error_code=... — show the "request a new link" message instead of a bare login page.
  const { error_code } = await searchParams;
  if (error_code) redirect("/admin/forgot-password?error=invalid-link");

  redirect("/admin/login");
}

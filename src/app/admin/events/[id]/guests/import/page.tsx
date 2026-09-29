import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getUserProfile, canAccessWedding } from "@/lib/auth";
import Breadcrumbs from "@/components/admin/Breadcrumbs";
import GuestImport from "@/components/admin/GuestImport";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ImportGuestsPage({ params }: PageProps) {
  const profile = await getUserProfile();
  if (!profile) {
    redirect("/admin/login");
  }

  const { id: weddingId } = await params;
  if (!(await canAccessWedding(weddingId))) {
    redirect("/admin/events");
  }

  const supabase = createServerClient();
  const [{ data: wedding, error }, { data: existing }] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase
      .from("guests")
      .select("guest_name, group_label")
      .eq("wedding_id", weddingId)
      .eq("is_primary", true),
  ]);

  if (error || !wedding) {
    notFound();
  }

  const existingNames = (existing ?? []).map((g) => g.group_label || g.guest_name);

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs items={[
          { label: "Events", href: "/admin/events" },
          { label: `${wedding.groom_name} & ${wedding.bride_name}`, href: `/admin/events/${weddingId}/dashboard` },
          { label: "Import Guests" },
        ]} />
      </div>

      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">Import Guests</h1>
        <p className="text-admin-text-muted text-sm mt-1">
          Upload a CSV or Excel file to create many invitations at once. You&apos;ll see a preview before anything is saved.
        </p>
      </div>

      <GuestImport weddingId={weddingId} wedding={wedding} existingNames={existingNames} />
    </div>
  );
}
